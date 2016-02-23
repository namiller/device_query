$.fn.SelectionTable = function() {
    this.selectionSet = [];
    this.inactiveSet = [];
    this.setData = function(dataArray) {
        this.html(''); //TODO: change this to not wipe out header/footer
        if (dataArray && dataArray.length) {
            for (var ind = 0; ind < dataArray.length; ind++) {
                this.append('<tr><td>'+dataArray[ind]+'<td></tr>');
            }
        }
    };

    this.inactive = function(set) {
        if (set === undefined)
            return this.inactiveSet;
        for (var ind = 0; ind < this.inactiveSet.length; ind++) {
            this.inactivate(this.inactiveSet[ind]);
        }
        if (set && set.length) {
            for (var ind = 0; ind < set.length; ind++) {
                this.activate(set[ind]);
            }
        }
    }

    this.activate = function(row) {
        var ind = this.inactiveSet.indexOf(row);
        if (ind != -1) {
            this.find('tr').eq(row).removeClass('inactive');
            this.inactiveSet.splice(ind,1);
        }
    };
    
    this.inactivate = function(row) {
        var ind = this.inactiveSet.indexOf(row);
        if (ind == -1) {
            this.inactiveSet.push(row);
            this.find('tr').eq(row).addClass('inactive');
        }
    };

    this.selectRow = function(row) {
        var ind = this.selectionSet.indexOf(row);
        if (ind == -1) {
            this.find('tr').eq(row).addClass('selected');
            this.selectionSet.push(row);
        }
    };

    this.deselectRow = function(row) {
        var ind = this.selectionSet.indexOf(row);
        if (ind != -1) {
            this.find('tr').eq(row).removeClass('selected');
            this.selectionSet.splice(ind,1);
        }
    };



    this.setInactive = function(rows) {

    };

    this.setActive = function(rows) {

    };
    
    //this.setData();
    return this;
};
