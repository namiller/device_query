# device_query
system for querying devices through a web interface

# Instalation Instructions:

```bash
git clone git@github.com:namiller/device_query.git some_name
cd some_name
npm install
node index.js
``` 

you can then navigate in your browser to http://localhost:8000/app/ and interact with the app.

# Setup:

To change the configuration details (ie device properties etc) you will want to edit config.json (README.md has details on how to do this). You will then probably want to delete store.db and call node index.js to recreate the database. You should then restart it so that it has the full database. This would look something like:

``` bash 
vim config.json [edit the file]
rm store.db
node index.js
cntrl-c
node index.js
```

# Migration:

If you have already started entering data into the database and you don't want to lose it, you should not delete store.db and it will attempt to migrate the entries if at all possible. That would just look like:

``` bash
vim config.json [edit the file]
node index.js
control-c
node index.js
```

# URL structure: 

API structure:

/api
+-- /router
|   +-- /query
+-- /user
|   +-- /query
+-- /transaction
|   +-- /query
+-- /transaction-map

APP structure:

/app
+-- /admin.html
+-- /index.html
+-- /device-admin.html
+-- /user-admin.html
+-- /transactions.html
+-- /query.html

# Notes:
to change the deployment port, change the port value on line 15 of index.js

the config.json file defines the used properties in the router table. If datatypes are changed or removed, manual migration may be required. Adding new properties should be handled automatically.

Allowable types are the same as the sqlite allowable affinities:
(section 2.2) https://www.sqlite.org/datatype3.html

The order of the elements in the ui is the order in config.json, however fields added after initialization will be appended to the list rather than in the order of the config.


