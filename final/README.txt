the config.json file defines the used properties in the router table. If datatypes are changed or removed, manual migration may be required. Adding new properties should be handled automatically.

Allowable types are the same as the sqlite allowable affinities:
(section 2.2) https://www.sqlite.org/datatype3.html


The order of the elements in the ui is the order in config.json, however fields added after initialization will be appended to the list rather than in the order of the config.
