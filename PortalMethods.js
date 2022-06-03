Sao.login = function() {
    console.log("INHERITED LOGIN: TO REMOVE ");
    Sao.set_title();
    Sao.i18n.setlang().always(function() {
        Sao.Session.get_credentials()
            .then(function(session) {
                Sao.Session.current_session = session;
                return session.reload_context();
            }).then(Sao.get_preferences).then(function(preferences) {
                window.KalenisAddons.Components.createPortalBridge(Sao.Session.current_session.portal_session);
                Sao.menu(preferences);
                Sao.user_menu(preferences);
                Sao.open_url();
                Sao.Bus.listen();
                
                
                
            });
    });
};

Sao.Session.prototype.init = function(database, login) {
    this.user_id = null;
    this.session = null;
    this.portal_session = null;
    this.cache = new Cache();
    this.prm = jQuery.when();  // renew promise
    this.database = database;
    this.login = login;
    if (this.database) {
        var session_data = localStorage.getItem(
            'sao_session_' + database);
        if (session_data !== null) {
            session_data = JSON.parse(session_data);
            if (!this.login || this.login == session_data.login) {
                this.login = session_data.login;
                this.user_id = session_data.user_id;
                this.session = session_data.session;
                this.portal_session = session_data.portal_session;
            }
        }
    }
    this.context = {
        client: Sao.Bus.id,
    };
    if (!Sao.Session.current_session) {
        Sao.Session.current_session = this;
    }
};

Sao.Session.prototype.do_login = function(login, parameters){
    var dfd = jQuery.Deferred();
        var func = function(parameters) {
            return {
                'method': 'common.db.login',
                'params': [login, parameters, Sao.i18n.getlang()]
            };
        };
        new Sao.Login(func, this).run().then(function(result) {
            this.login = login;
            this.user_id = result[0];
            this.session = result[1][0];
            if(result[1].length > 1){
                this.portal_session = result[1][1];
            }
            this.store();
            dfd.resolve();
        }.bind(this), function() {
            this.user_id = null;
            this.session = null;
            this.store();
            dfd.reject();
        }.bind(this));
        return dfd.promise();
};

Sao.Session.prototype.do_logout = function() {
    if (!(this.user_id && this.session)) {
        return jQuery.when();
    }
    var args = {
        'id': 0,
        'method': 'common.db.logout',
        'params': []
    };
    var prm = jQuery.ajax({
        'headers': {
            'Authorization': 'Session ' + this.get_auth()
        },
        'contentType': 'application/json',
        'data': JSON.stringify(args),
        'dataType': 'json',
        'url': '/' + this.database + '/',
        'type': 'post',
    });
    this.unstore();
    this.database = null;
    this.login = null;
    this.user_id = null;
    this.session = null;
    this.portal_session = null;
    if (Sao.Session.current_session === this) {
        Sao.Session.current_session = null;
    }
    return prm;
};

Sao.Session.prototype.store= function() {
    var session = {
        'login': this.login,
        'user_id': this.user_id,
        'session': this.session,
        'portal_session': this.portal_session

    };
    session = JSON.stringify(session);
    localStorage.setItem('sao_session_' + this.database, session);
};


// Copy cache cause is not part of any scope
var Cache = Sao.class_(Object, {
    init: function() {
        this.store = {};
    },
    cached: function(prefix) {
        return prefix in this.store;
    },
    set: function(prefix, key, expire, value) {
        expire = new Date(new Date().getTime() + expire * 1000);
        Sao.setdefault(this.store, prefix, {})[key] = {
            'expire': expire,
            'value': JSON.stringify(Sao.rpc.prepareObject(value)),
        };
    },
    get: function(prefix, key) {
        var now = new Date();
        var data = Sao.setdefault(this.store, prefix, {})[key];
        if (!data) {
            return undefined;
        }
        if (data.expire < now) {
            delete this.store[prefix][key];
            return undefined;
        }
        return Sao.rpc.convertJSONObject(jQuery.parseJSON(data.value));
    },
    clear: function(prefix) {
        if (prefix) {
            this.store[prefix] = {};
        } else {
            this.store = {};
        }
    },
});

// Sao.menu = function(preferences) {
//     console.log("INHERITED SAO.MENU");
//     if (!preferences) {
//         var session = Sao.Session.current_session;
//         Sao.rpc({
//             'method': 'model.res.user.get_preferences',
//             'params': [false, {}],
//         }, session).then(Sao.menu);
//         return;
//     }
//     var decoder = new Sao.PYSON.Decoder();
//     var action = decoder.decode(preferences.pyson_menu);
//     var view_ids = false;
//     if (!jQuery.isEmptyObject(action.views)) {
//         view_ids = action.views.map(function(view) {
//             return view[0];
//         });
//     } else if (action.view_id) {
//         view_ids = [action.view_id[0]];
//     }
//     decoder = new Sao.PYSON.Decoder(Sao.Session.current_session.context);
//     var action_ctx = decoder.decode(action.pyson_context || '{}');
//     var domain = decoder.decode(action.pyson_domain);
//     var form = new Sao.Tab.Form(action.res_model, {
//         'mode': ['tree'],
//         'view_ids': view_ids,
//         'domain': domain,
//         'context': action_ctx,
//         'selection_mode': Sao.common.SELECTION_NONE,
//         'limit': null,
//         'row_activate': Sao.main_menu_row_activate,
//     });
//     Sao.main_menu_screen = form.screen;
//     Sao.main_menu_screen.switch_callback = null;
//     Sao.Tab.tabs.splice(Sao.Tab.tabs.indexOf(form), 1);
//     form.view_prm.done(function() {
//         var view = form.screen.current_view;
//         view.table.removeClass('table table-bordered table-striped');
//         view.table.addClass('no-responsive');
//         view.table.find('thead').hide();
//         var gs = new Sao.GlobalSearch();
//         jQuery('#global-search').empty();
//         jQuery('#global-search').append(gs.el);
//         jQuery('#menu').empty();
//         jQuery('#menu').append(
//             form.screen.screen_container.content_box.detach());
//         var column = new FavoriteColumn(form.screen.model.fields.favorite);
//         form.screen.views[0].table.find('> colgroup').append(column.col);
//         form.screen.views[0].table.find('> thead > tr').append(column.header);
//         form.screen.views[0].columns.push(column);
//         // console.log("END MENU RENDERER");
//         // console.log(window.portal_connection.routes);
//         // var tbody = document.getElementById('menu').getElementsByTagName('tbody')[0];
//         // tbody.append('<tr><td>NO LOOPO</td></tr>');
//         // console.log("TBODY FOUND");
//         // console.log(tbody);
//         // window.portal_connection.visible_routes.forEach(function(route){
//         // console.log("ADDING ROUTE");
//         // console.log(route.title);
//         // // view.table.find('tbody')[0].add('<tr><td>HOLA</td></tr>');
//         // // tbody.append('<tr><td>HOLA</td></tr>');
//         // jQuery('.tree table-hover table-condensed no-responsive > tbody:last-child').append('<tr><td>HOLA</td></tr>');

//         // });

//     });
    
// };

Sao.View.Tree.prototype.display = function(selected, expanded) {
    var current_record = this.record;
    if (jQuery.isEmptyObject(selected)) {
        selected = this.get_selected_paths();
        if (this.selection.prop('checked') &&
            !this.selection.prop('indeterminate')) {
            this.screen.group.slice(
                this.rows.length, this.display_size)
                .forEach(function(record) {
                    selected.push([record.id]);
                });
        } else {
            if (current_record) {
                var current_path = current_record.get_path(this.group);
                current_path = current_path.map(function(e) {
                    return e[1];
                });
                if (!Sao.common.contains(selected, current_path)) {
                    selected = [current_path];
                }
            } else if (!current_record) {
                selected = [];
            }
        }
    }
    expanded = expanded || [];

    if (this.selection_mode == Sao.common.SELECTION_MULTIPLE) {
        this.selection.show();
    } else {
        this.selection.hide();
    }

    var row_records = function() {
        return this.rows.map(function(row) {
            return row.record;
        });
    }.bind(this);
    var min_display_size = Math.min(
            this.group.length, this.display_size);
    // XXX find better check to keep focus and expanded
    if (this.children_field) {
        this.construct();
    } else if ((min_display_size > this.rows.length) &&
        Sao.common.compare(
            this.group.slice(0, this.rows.length),
            row_records())) {
        this.construct(true);
    } else if ((min_display_size != this.rows.length) ||
        !Sao.common.compare(
            this.group.slice(0, this.rows.length),
            row_records())){
        this.construct();
    }

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
    var min_width = 0;
    this.columns.forEach(function(column) {
        visible_columns += 1;
        var name = column.attributes.name;
        if (!name) {
            return;
        }
        var related_cells = column.footers.slice();
        related_cells.push(column.header);
        if ((decoder.decode(column.attributes.tree_invisible || '0')) ||
                (name === this.screen.exclude_field)) {
            visible_columns -= 1;
            related_cells.forEach(function(cell) {
                cell.hide();
                cell.addClass('invisible');
            });
        } else {
            var inv_domain = inversion.domain_inversion(domain, name);
            if (typeof inv_domain != 'boolean') {
                inv_domain = inversion.simplify(inv_domain);
            }
            var unique = inversion.unique_value(inv_domain)[0];
            if (unique && jQuery.isEmptyObject(this.children_field)) {
                visible_columns -= 1;
                related_cells.forEach(function(cell) {
                    cell.hide();
                    cell.addClass('invisible');
                });
            } else {
                related_cells.forEach(function(cell) {
                    cell.show();
                    cell.removeClass('invisible');
                });
            }
        }

        if (column.header.hasClass('invisible')) {
            column.col.css('width', 0);
            column.col.hide();
        } else if (!column.col.hasClass('draggable-handle') &&
            !column.col.hasClass('selection-state') &&
            !column.col.hasClass('favorite')) {
            var width = {
                'integer': 6,
                'biginteger': 6,
                'float': 8,
                'numeric': 8,
                'selection': 9,
                'one2many': 5,
                'many2many': 5,
                'boolean': 2,
                'binary': 20,
            }[column.attributes.widget] || 10;
            var factor = 1;
            if (column.attributes.expand) {
                factor += parseInt(column.attributes.expand, 10);
            }
            column.col.css('width', width * 100 * factor  + '%');
            column.col.show();
            min_width += width * 10;
        }
    }.bind(this));
    this.table.css('min-width', min_width + 'px');
    this.scrollbar.css('min-width', min_width + 'px');
    this.tbody.find('tr.more-row > td').attr(
        'colspan', visible_columns);

    if (!this.table.hasClass('no-responsive') &
        (this.columns.filter(function(c) {
            return !c.header.hasClass('invisible');
        }).length > 1)) {
        this.table.addClass('responsive');
        this.table.addClass('responsive-header');
    } else {
        this.table.removeClass('responsive');
        this.table.removeClass('responsive-header');
    }

    this.update_arrow();

    // var add_portal_menu = function(){
    //     var tbody = jQuery('.tree table-hover table-condensed no-responsive');
    //     console.log("Table FOUND =?");
    //     console.log(tbody);
    //     window.portal_connection.visible_routes.forEach(function(route){
    //         tbody.append('<tr><td>HOLA</td></tr>');
        
    //         });
    // };
    return this.redraw(selected, expanded).done(function(){
        console.log("After Redraw");
        Sao.common.debounce(this.update_sum.bind(this), 250);
        // Sao.common.debounce(add_portal_menu(), 250);
        this.add_portal_menu();

        
    }.bind(this));
    // return this.redraw(selected, expanded).done(
    //     Sao.common.debounce(this.update_sum.bind(this), 250));
    
        
};

Sao.View.Tree.prototype.open_portal_view = function(route){
    console.log("OPENNING VIEW");
    console.log(route);
    var attributes = {
        'portal_view':route,
        'name':route.name,
        
    };
    Sao.Tab.create(attributes, false);
};

Sao.View.Tree.prototype.add_portal_menu = function(selected, expanded) {
    console.log("TBODY ON CLASS NREW METHODS ?");
    console.log(this.tbody);
    window.portal_bridge.connection.visible_routes.forEach(function(route){
        var new_tr = jQuery('<tr/>');
       
        var new_td = jQuery('<td/>', {
            'style': "display:inline-block;",
           
        });
        new_td.append('<div class="cell"><span class="widget"><div class="column-char">'+route.name+'</div></span>');
        new_tr.append(new_td);
        new_td.click(function() {
            this.open_portal_view(route);
        }.bind(this));
        this.tbody.prepend(new_tr);
    
        }.bind(this));
};

Sao.Tab.create = function (attributes, new_browser_tab) {
    var tablist = jQuery('#tablist');
    if (attributes.context === undefined) {
        attributes.context = {};
    }
    // Kalenis: Prevent duplicate validation if shift key, set shift to false
    if (!Sao.temp_shift && !new_browser_tab) {
        for (var i = 0; i < Sao.Tab.tabs.length; i++) {
            var other = Sao.Tab.tabs[i];
            if (other.compare(attributes)) {
                tablist.find('a[href="#' + other.id + '"]').tab('show');
                return;
            }
        }
    }
    else {
        Sao.temp_shift = false;
    }

    var tab;
    if (attributes.portal_view){
        tab = new Sao.Tab.PortalView(attributes);
    }
    else if (attributes.model) {
        tab = new Sao.Tab.Form(attributes.model, attributes);
    } else {
        tab = new Sao.Tab.Board(attributes);
    }
    tab.view_prm.done(function () {
        if (!new_browser_tab) {
            Sao.Tab.add(tab);
        }
        else {

            var session = Sao.Session.current_session;
            var url = window.location.origin + '#' + session.database;
            url += '/' + tab.get_url();

            tab.close();

            window.open(url, '_blank');




        }

    });
};

Sao.Tab.PortalView = Sao.class_(Sao.Tab, {
    class_: 'tab-portal-view',
    init: function(attributes) {
        Sao.Tab.PortalView._super.init.call(this, attributes);
        console.log("INIT ON TAB.PORALVIEW");
        this.attributes = attributes;
        this.portal_view = attributes.portal_view;
        this.set_name(attributes.name || '');
        this.create_tabcontent();
        
    },
    create_tabcontent: function() {
        this.el = jQuery('<div/>', {
            'class': 'panel panel-default ' + this.class_,
        });

        // var toolbar = this.create_toolbar().appendTo(this.el);
        // this.title = toolbar.find('.title');

        this.content = jQuery('<div/>', {
            'class': 'panel-body',
        }).appendTo(this.el);
        this.content.append('<div>This will be the component>/>');
        var view_args = {
            element: this.content[0],
            screen: window.portal_bridge.app.addScreen(this.portal_view, Sao.View.Tree.prototype.open_portal_view, {}, {})
        };
        window.KalenisAddons.Components.createPortalView(view_args);
        // if (this.info_bar) {
        //     this.el.append(this.info_bar.el);
        // }
    },
    get_url: function(){
        return "portal/"+this.portal_view.id.toString();
    }
});