var express = require('express');
var fs = require('fs');
var sqlite3 = require('sqlite3');
var bodyParser = require("body-parser");
var async = require('async');

var app = express();
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

var store = 'store.db';
var exists = fs.existsSync(store);
var db = new sqlite3.Database(store);

var port = 8000;

var configs_raw = fs.readFileSync('config.json');
var config = JSON.parse(configs_raw);
console.log(config);

var router_cols, user_cols, transaction_cols, transaction_map_cols;
db.serialize(function() {
    db.run("PRAGMA foreign_keys = ON");
    if (!exists) {
        db.run("CREATE TABLE routers (router_id INTEGER PRIMARY KEY)");
        db.run("CREATE TABLE users (user_id INTEGER PRIMARY KEY, name TEXT, email TEXT)"); //TODO: consider adding username TEXT
        db.run("CREATE TABLE transactions (transact_id INTEGER PRIMARY KEY, user TEXT, status INTEGER, comment TEXT, date DATE, client TEXT)"); 
        db.run("CREATE TABLE transaction_map (transact_id INTEGER, router_id INTEGER, PRIMARY KEY (transact_id, router_id), " +
                "FOREIGN KEY (transact_id) REFERENCES transactions (transact_id) ON DELETE CASCADE, " +
                "FOREIGN KEY (router_id) REFERENCES routers (router_id) ON DELETE CASCADE)");
    }
    // Cross reference the list of properties in config.json with database
    db.all("PRAGMA table_info(routers)", function (err, out) {
        for (ind in config.properties) {
            var nm = config.properties[ind].name;
            var tp = config.properties[ind].type;
            var found = false;
            for (i in out) {
                if (out[i].name.toUpperCase() === nm.toUpperCase()) {
                    found = true;
                    if (out[i].type.toUpperCase() !== tp.toUpperCase()) {
                        console.log("type changed. Please revert. "+nm+"was changed from " + out[i].type + " to " + tp);
                    }
                    break;
                }
            }
            if (!found) {
                db.run("ALTER TABLE routers ADD " + nm + " " + tp);
            }
        }
        console.log(out);
    });
    db.all("PRAGMA table_info(routers)", function (err, out) {
        router_cols = out;
    });
    db.all("PRAGMA table_info(users)", function (err, out) {
        user_cols= out;
    });
    db.all("PRAGMA table_info(transactions)", function (err, out) {
        transaction_cols = out;
    });
    db.all("PRAGMA table_info(transaction_map)", function (err, out) {
        transaction_map_cols = out;
    });
});

app.use('/app', express.static('./static/'));

var post_responder = function(db_handle, req, res) {
    console.log('post request');
    console.log(req.body);
    var callback = function(err) {
        if (err == null) {
            res.send(this);
        } else {
            res.send('error: ' + err);
        }
    }
    try {
        switch (req.body['op']) {
            case 'add':
                var cols = '';
                var vals = '';
                var args = [];
                for (ind in req.body['properties']) {
                    cols = cols + ind + ',';
                    vals = vals + '?,';
                    args.push(req.body['properties'][ind]);
                }
                cols = cols.slice(0,-1);
                vals = vals.slice(0,-1);
                args.unshift("INSERT INTO " + db_handle + " (" + cols + ") VALUES (" + vals + ")");
                args.push(callback);
                db.serialize(function() {
                    db.run.apply(this, args);
                });
                break;
            case 'update':
                db.serialize(function() {
                    db.run('UPDATE ' + db_handle + ' SET '+req.body.property+' = ? WHERE rowid = ?', req.body.new, req.body.id, callback);
                });
                break;
            case 'delete':
                db.serialize(function() {
                    db.run('DELETE FROM ' + db_handle + ' WHERE rowid=?', req.body.id, callback);
                });
                break;
            default:
                res.send('unknown operation requested');
                return;
        }
    } catch (all) {
        res.send('illformed request ' + all);
        return;
    }
};

app.post('/api/router', post_responder.bind(this, 'routers'));

app.post('/api/user', post_responder.bind(this, 'users'));

app.post('/api/transaction', post_responder.bind(this, 'transactions'));

var get_responder = function(db_handle, req, res) {
    var compose = function (arry, tween) {
        var ret = "";
        for (ind in arry) {
            ret = ret + arry[ind] + tween;
        }
        ret = ret.slice(0, -1 * tween.length);
        return ret;
    }
    var empty = function(obj) {
        for (ind in obj) {
            return false;
        }
        return true;
    }
    // handle the fields portion of the API
    var fields = "*";
    if (req.query.fields && req.query.fields.length > 0) {
        fields = compose(req.query.fields, ", ");
    }

    // handle the matches portion of the API
    var clauses = [];
    var args = [];
    if (req.query.matches && !empty(req.query.matches)) {
        for (prop in req.query.matches) {
            var conjunct = [];
            for (ind in req.query.matches[prop]) {
                conjunct.push(prop + " = ? ");
                args.push(req.query.matches[prop][ind]);
            }
            clauses.push("( " + compose(conjunct, " OR ") + " )");
        }
    }
    if (req.query.ranges && !empty(req.query.ranges)) {
       for (prop in req.query.ranges) {
           clauses.push(prop + " BETWEEN ? AND ?");
           args.push(req.query.ranges[prop].min);
           args.push(req.query.ranges[prop].max);
       }
    }
    if (req.query.searches && req.query.searches.length > 0) {
        for (prop in req.query.searches) {
            var str = "";
            console.log(req.query.searches[prop].start);
            if (req.query.searches[prop].start === 'false' || req.query.searches[prop].start === false) {
                str = "%";
            }
            str = str + req.query.searches[prop].string + "%";
            args.push(str);
            clauses.push(req.query.searches[prop].field + " LIKE ? ");
        }
    }
    console.log(clauses);
    var quer = " WHERE ";
    if (clauses.length > 1) {
        quer =  quer +"(" + compose(clauses, " ) AND ( ") + ")";
    } else if (clauses.length == 1) {
        quer = quer + clauses[0];
    } else {
        quer = "";
    }
    console.log(quer);

    db.serialize(function() {
        console.log('SELECT DISTINCT ' + fields + ' FROM ' + db_handle + quer);
        args.unshift('SELECT DISTINCT ' + fields + ' FROM ' + db_handle + quer);
        console.log(args);
        args.push(function(err,data) {
            if (err == null) {
                res.send(data);
            } else {
                res.send('query error: ' + err);
            }
        });
        db.all.apply(this, args);
    });
};

/*
 * query: {'transaction': transact_id}
 * query: {'router': router_id}
 */
app.get('/api/transaction_map', function (req, res) {
    var transaction = req.query.transaction;
    var router = req.query.router;
    if (router !== undefined && router !== '') {
        db.all('SELECT DISTINCT (transact_id) FROM transaction_map WHERE router_id=?', router, function(e,d) {
            console.log('SELECT DISTINCT (transact_id) FROM transaction_map WHERE router_id=?' + router);
            if (e == null) {
                res.send(d);
            } else {
                res.send('query error: ' + e);
            }
        });
        return;
    }
    if (transaction !== undefined && transaction !== '') {
        db.all('SELECT DISTINCT (router_id) FROM transaction_map WHERE transact_id=?', transaction, function(e,d) {
            console.log('SELECT DISTINCT (router_id) FROM transaction_map WHERE transact_id=?' + transaction);
            if (e == null) {
                res.send(d);
            } else {
                res.send('query error: ' + e);
            }
        });
    }
    return;
});

/*
 * query: {'op': 'add', 'transaction':transact_id, 'routers':[router_id, router_id ...]};
 * query: {'op': 'delete', 'transaction':transact_id, 'routers':[router_id, router_id ...]};
 * query: {'op': 'clear', 'transaction':transact_id}
 */
app.post('/api/transaction_map', function (req, res) {
    var transaction  = req.body['transaction'];
    var routers = req.body['routers'];
    console.log(req.body);
    switch (req.body['op']) {
        case 'add':
            if (transaction === undefined || transaction === '' || routers === undefined || routers.length <= 0) {
                res.send('invalid request');
                return;
            }
            // serialize this all as one op
            for (var router in routers) {
                db.run('INSERT INTO transaction_map (transact_id, router_id) VALUES (?, ?)', transaction, routers[router]);
            }
            res.send('success');
            return;
        case 'delete':
            if (transaction === undefined || transaction === '' || routers === undefined || routers.length <= 0) {
                res.send('invalid request');
                return;
            }
            // serialize this all as one op
            for (var router in routers) {
                db.run('DELETE FROM transaction_map WHERE transact_id=? AND router_id=?', transaction, router);
            }
            res.send('success');
            return;
        case 'clear':
            if (transaction === undefined || transaction === '') {
                res.send('invalid request');
                return;
            }
            db.run('DELETE FROM transaction_map WHERE transact_id=?', transaction);
            res.send('success');
            return;
    }
    res.send('failure');
    return;
});

app.get('/api', function (req, res) {
    res.send(['router', 'user', 'transaction', 'transaction_map']);
});

app.get('/api/router/query', get_responder.bind(this, 'routers'));

app.get('/api/user/query', get_responder.bind(this, 'users'));

app.get('/api/transaction/query', get_responder.bind(this, 'transactions'));

app.get('/api/router', function(req, res) {
    ret = {};
    var i = 0;
    for (ind in router_cols) {
        var line = router_cols[ind];
        ret[line.name] = {'type': line.type};
        ret[line.name].index = i++;
    }
    min_series = {};
    max_series = {};
    var fnc = function(call ,column, callback) {
        db.get('SELECT '+call+'('+column+') FROM routers', function(err,row) {
            for (key in row) {
                callback(null, row[key]);
                break;
            }
        });
    };
    for (col in ret) {
        min_series[col] = fnc.bind(this,'MIN', col);
        max_series[col] = fnc.bind(this,'MAX', col);
    }
    db.serialize(function() {
        async.series(min_series, function(err, mins) {
            async.series(max_series, function(err, maxs) {
                for (col in ret) {
                    ret[col].min = mins[col];
                    ret[col].max = maxs[col];
                }
                res.send(ret);
            });
        });
    });
});

app.get('/api/user', function(req, res) {
    res.send(user_cols);
});

app.get('/api/transaction', function(req, res) {
    res.send(transaction_cols);
});

app.listen(port, function() {
    console.log('Expample app listening on port '+port);
})
