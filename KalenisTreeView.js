Sao.View.KalenisTreeXMLViewParser = Sao.class_(Sao.View.XMLViewParser, {
    _parse_tree: function(node, attributes) {
        [].forEach.call(node.childNodes, function(child) {
            this.parse(child);
        }.bind(this));
    },
    _parse_field: function(node, attributes) {
        var name = attributes.name;
        var column = {
            type: 'field',
            model: this.view.screen.model,
            field : this.view.screen.model.fields[attributes.name],
            attributes: attributes,
            prefixes: [],
            suffixes: [],
            header: null,
            footers: []
        };

        if (!this.view.widgets[name]) {
            this.view.widgets[name] = [];
        }
        this.view.widgets[name].push(column);
        if ('icon' in attributes) {
            var icon_prefix = {
                attributes: attributes,  
                icon:attributes.icon
            };
            column.prefixes.push(icon_prefix);
           
        }
       


        if (!this.view.attributes.sequence &&
                !this.view.children_field &&
                this.field_attrs[name].sortable !== false){
            column.sortable = true;
        }
        this.view.columns.push(column);

        
    },
    _parse_button: function(node, attributes) {
       
        var column = {
            view: this.view,
            type: 'button',
            attributes: attributes
        };
        this.view.columns.push(column);
    }
});

Sao.View.KalenisTree = Sao.class_(Sao.View, {
    view_type: 'tree',
    xml_parser: Sao.View.KalenisTreeXMLViewParser,
    init: function(view_id, screen, xml, children_field) {
        this.children_field = children_field;
        this.sum_widgets = {};
        this.columns = [];
        this.selection_mode = (screen.attributes.selection_mode ||
            Sao.common.SELECTION_MULTIPLE);
        this.el = jQuery('<div/>', {
            'class': 'treeview responsive'
        });
        this.screen = screen;
        this.expanded = {};
        
        this.field_name = screen.field_name;

        if(screen.field_instance){
            this.field_instance = screen.field_instance;
        }
        if(screen.field_type !== undefined){
            this.view_context = screen.field_type;

        }
        else{
            this.view_context = 'list_view';
        }
        if (this.screen.attributes.board_child){
            this.el.uniqueId();
            this.el.attr('id', this.el.attr('id').concat('_addon'));
        }
        else if (this.screen.tab) {
            this.el.attr('id', this.screen.tab.id + '_addon');
        }
        else if (this.field_name) {
            this.el.attr('id', this.field_name + '_addon');
        }
        else{
            this.el.uniqueId();
            this.el.attr('id', this.el.attr('id').concat('_addon'));
        }

        Sao.View.KalenisTree._super.init.call(this, view_id, screen, xml);

        
        this.rows = [];
        this.edited_row = null;
        this.records_selection = [];
        
        var sum_row;
        
       
    },
    get editable() {
        return (Boolean(this.attributes.editable) &&
            !this.screen.attributes.readonly);
    },
    sort_model: function(col, direction){
        var column = col;
        
        if(direction){
            this.screen.order = [[column.attributes.name, 'ASC']];
        }
        else{
            this.screen.order = [[column.attributes.name, 'DESC']];
        }
        
        var unsaved_records = [];
        this.group.forEach(function(unsaved_record) {
                if (unsaved_record.id < 0) {
                    unsaved_records = unsaved_record.group;
            }
        });
        var search_string = this.screen.screen_container.get_text();
        if ((!jQuery.isEmptyObject(unsaved_records)) ||
                (this.screen.search_count == this.group.length) ||
                (this.group.parent)) {
            this.screen.search_filter(search_string, true).then(
            function(ids) {
                this.group.sort(function(a, b) {
                    a = ids.indexOf(a.id);
                    a = a < 0 ? ids.length : a;
                    b = ids.indexOf(b.id);
                    b = b < 0 ? ids.length : b;
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                this.screen.display();
            }.bind(this));
        } else {
            this.screen.search_filter(search_string);
        }
    },
    
    get_fields: function() {
        return Object.keys(this.widgets);
    },
    get_buttons: function() {
        var buttons = [];
        this.columns.forEach(function(column) {
            if (column.type === 'button') {
                buttons.push(column);
            }
        });
        return buttons;
    },
    display: function(selected, expanded) {
       
        var current_record = this.record;
        
        expanded = expanded || [];

        // Set column visibility depending on attributes and domain
        var visible_columns = 1;  // start at 1 because of the checkbox
        var domain = [];
        if (!jQuery.isEmptyObject(this.screen.domain)) {
            domain.push(this.screen.domain);
        }
        var tab_domain = this.screen.screen_container.get_tab_domain();
        if (!jQuery.isEmptyObject(tab_domain)) {
            domain.push(tab_domain);
        }
        
        var inversion = new Sao.common.DomainInversion();
        domain = inversion.simplify(domain);
        var decoder = new Sao.PYSON.Decoder(this.screen.context);

       
        var group = [];

        
        if(!this.screen.group.no_update){

            if(this.screen.context.kalenis_board){
                
                group =  this.screen.group.filter(function(record){
                    return !record.group.record_removed.includes(record);
                });
                
                
            }
            else{
                this.screen.group.map(function (record) {
                    group.push(record);
                });
            }
            
    
            Sao.KalenisAddons.Components.createTreeView({ 
                element: this.el[0],
                sao_props: { 
                    domain:domain, 
                    screen: this.screen, 
                    columns: this.columns, 
                    group: group,  
                    field_name: this.field_name,field_instance:this.field_instance || null, 
                    view_context:this.view_context, 
                    session:Sao.Session.current_session } });

        }
        

        
    },
    construct: function(extend) {
       
       
    },

    
    switch_: function(path) {
        this.screen.row_activate();
    },
    
    update_sum: function() {
       
    },
    get selected_records () {
      
        return this.records_selection;
    },
    set_selected_records: function (records) {
        this.records_selection = records;
    },
    
    // update_selection: function() {
       
    // },
    get_selected_paths: function() {
        
    },
    get_expanded_paths: function(starting_path, starting_id_path) {
        
    },
    // find_row: function(path) {
        
    // },
    // n_children: function(row) {
    //     if (!row || !this.children_field) {
    //         return this.rows.length;
    //     }
    //     return row.record._values[this.children_field].length;
    // },
    set_cursor: function(new_, reset_view) {
        return true;
        
    },
});