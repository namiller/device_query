function sql_type(type) {
    'use strict';
    switch (type.toUpperCase()) {
    case "INTEGER":
    case "INT":
    case "SMALLINT":
    case "MEDIUMINT":
    case "BIGINT":
    case "UNSIGNED BIG INT":
    case "INT2":
    case "INT8":
        return 0;
    case "NUMERIC":
    case "REAL":
    case "DOUBLE":
    case "DOUBLE PRECISION":
    case "FLOAT":
        return 1;
    case "DATE":
    case "DATETIME":
        return 2;
    case "BOOLEAN":
        return 3;
    }
    return 4;
}

function sql_form_input(type, name) {
    'use strict';
    if (sql_type(type) === 4) {
        return $('<input>', {'class': 'ipt form-control', 'type': 'text'});
    } else if (sql_type(type) <= 1) {
        return $('<input>', {'class': 'ipt form-control', 'type': 'number'});
    } else if (sql_type(type) === 2) {
        return $('<input>', {'class': 'ipt form-control', 'type': 'date'});
    }
    var y = $('<label>', {'class': 'btn btn-default'}).html('Yes').append($('<input>', {'type': 'radio', 'name': name}));
    var n = $('<label>', {'class': 'btn btn-default'}).html('No').append($('<input>', {'type': 'radio', 'name': name}));
    var na = $('<label>', {'class': 'btn btn-default'}).html('N/A').append($('<input>', {'type': 'radio', 'name': name}));
    na.addClass('active');
    var sel = $('<div>', {'class': 'ipt btn-group', 'data-toggle': 'buttons'}).append(y).append(n).append(na);
    sel.on('val', function (e, v) {
        $(this).children().removeClass('active');
        if (v === '1') {
            $(this).children().eq(0).addClass('active');
        } else if (v === '0') {
            $(this).children().eq(1).addClass('active');
        } else {
            $(this).children().eq(2).addClass('active');
        }
    });
    sel.on('get', function (e, out) {
        console.log(this);
        if ($(this).children().eq(0).hasClass('active')) {
            out.val = 1;
        } else if ($(this).children().eq(1).hasClass('active')) {
            out.val = 0;
        } else {
            out.val = '';
        }
    });
    return sel;
}

function set_sql_form_value(input_el, val) {
    'use strict';
    $(input_el).val(val);
    $(input_el).trigger('val', val);
}

function get_sql_form_value(input_el) {
    'use strict';
    var o = {};
    $(input_el).trigger('get', o);
    if (o.val !== undefined) {
        return o.val;
    }
    return $(input_el).val();
}

function getCookie(key) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + key + "=");
    if (parts.length == 2) {
        return parts.pop().split(";").shift();
    }
}

function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}