

//Common.js
// Sao.config.pallete = {
//     'toolbar_icons':'white'
// };

Sao.config.icon_colors = {
    'toolbar_icons': 'white',
    'default': '#3465a4',

};
Sao.config.limit = 200;
Sao.config.display_size= 40;

//add Kalenis Addons
Sao.KalenisAddons = {};

//TODO
//Temporary direct print method
Sao.common.direct_print = function (data, file_name) {
    var options = { type: 'application/pdf' };
    var blob = new Blob([data], options);
    var testUrl = window.URL.createObjectURL(blob);


    var testPrint = window.open(testUrl, file_name);
    testPrint.onafterprint = function () { testPrint.close(); };

    $(testPrint.document).ready(function () {
        setTimeout(function () { testPrint.print(); }, 3000);


    });
};


//session.js

Sao.Session.prototype.reload_context = function () {
    console.log("EXECUTING RELOAD CONTEXT");
    var args = {
        'method': 'model.res.user.get_preferences',
        'params': [true, {}]
    };
    this.context = {
        client: Sao.Bus.id,
        //kalenis: Add view_tree_width as true. 
        // 5.6 requires te get it on context for retrieve column width
        view_tree_width: true
    };
    //add view manager access to context
    var vm_args = {
        'method': 'model.user.view.user_view_manager_access',
        'params': []
    };
    var vm_prm = Sao.rpc(vm_args, this);
    vm_prm.then(function (res) {
        jQuery.extend(this.context, res);
    }.bind(this));
    ///////
    var prm = Sao.rpc(args, this);
    return prm.then(function (context) {
        jQuery.extend(this.context, context);
    }.bind(this));
};


//END session.js



// Sao.Session.prototype.reload_context = function() {

//     var args = {
//         'method': 'model.res.user.get_preferences',
//         'params': [true, {}]
//     };
//     this.context = {
//         client: Sao.Bus.id,
//     };
//     var prm = Sao.rpc(args, this);

//     //add view manager access to context
//     var vm_args = {
//         'method':'model.user.view.user_view_manager_access',
//         'params':[]
//     };
//     var vm_prm = Sao.rpc(vm_args, this);
//     vm_prm.then(function(res){
//         jQuery.extend(this.context, res);
//     }.bind(this));
//     ///////

//     return prm.then(function(context) {
//         jQuery.extend(this.context, context);
//     }.bind(this));
// };

Sao.common.IconFactory.prototype._convert = function (data, type) {
    var xml = jQuery.parseXML(data);

    // jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors[0]);
    //kalenis

    if (type && Sao.config.icon_colors[type]) {
        jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors[type]);
    }
    else {
        jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors.default);
    }


    data = new XMLSerializer().serializeToString(xml);
    var blob = new Blob([data],
        { type: 'image/svg+xml' });
    return window.URL.createObjectURL(blob);
};

Sao.common.IconFactory.prototype.get_icon_url = function (icon_name, type) {
    if (!icon_name) {
        return jQuery.when('');
    }
    return this.register_icon(icon_name).then(function () {
        var complete_name = "";
        if (type) {
            complete_name = icon_name.concat('_').concat(type);
        }
        else {
            complete_name = icon_name;
        }
        if (complete_name in this.loaded_icons) {

            return this.loaded_icons[complete_name];
        } else {
            return jQuery.get('images/' + icon_name + '.svg', null, null, 'text')
                .then(function (icon) {

                    var img_url = this._convert(icon, type);
                    this.loaded_icons[complete_name] = img_url;
                    return img_url;
                }.bind(this));
        }
    }.bind(this));
};

Sao.common.IconFactory.prototype.get_icon_img = function (icon_name, attrs) {
    attrs = attrs || {};
    if (!attrs['class']) {
        attrs['class'] = 'icon';
    }

    var type = attrs.type || false;



    var img = jQuery('<img/>', attrs);
    if (icon_name) {
        this.get_icon_url(icon_name, type).then(function (url) {
            img.attr('src', url);
        });
    }
    return img;
};

Sao.common.InputCompletion.prototype.init = function (el, source, match_selected, format) {
    if (!el.is('input')) {
        el.addClass('dropdown');
        this.dropdown = el;
    } else {
        el.wrap('<div class="dropdown"/>');
        this.dropdown = el.parent();
    }
    this.input = el.find('input').add(el.filter('input')).first();
    this.input.attr('autocomplete', 'off');
    // bootstrap requires an element with data-toggle
    jQuery('<span/>', {
        'data-toggle': 'dropdown'
    }).appendTo(this.dropdown);
    this.menu = jQuery('<ul/>', {
        'class': 'dropdown-menu',
        'role': 'listbox'
    }).appendTo(this.dropdown);
    this.separator = jQuery('<li/>', {
        'role': 'separator',
        'class': 'divider'
    }).appendTo(this.menu);
    this.separator.hide();

    this.source = source;
    this.match_selected = match_selected;
    this.format = format;
    this.action_activated = null;

    this._search_text = null;

    this.input.on('input', function () {
        window.setTimeout(this._input.bind(this), 300,
            this.input.val());
    }.bind(this));
    this.input.keydown(function (evt) {
        if (evt.which == Sao.common.ESC_KEYCODE) {
            if (this.dropdown.hasClass('open')) {
                evt.preventDefault();
                evt.stopPropagation();
                this.menu.dropdown('toggle');
            }
        } else if (evt.which == Sao.common.DOWN_KEYCODE) {
            if (this.dropdown.hasClass('open')) {
                evt.preventDefault();
                evt.stopPropagation();
                this.menu.find('li > a').first().focus();
            }
        }
    }.bind(this));
    this.menu.keydown(function (evt) {
        if (evt.which == Sao.common.ESC_KEYCODE) {
            evt.preventDefault();
            evt.stopPropagation();
            this.menu.dropdown('toggle');
        }
    }.bind(this));
    // We must set the overflow of the treeview and modal-body
    // containing the input to visible to prevent vertical scrollbar
    // inherited from the auto overflow-x
    // Idem when in navbar collapse for the overflow-y
    // (see http://www.w3.org/TR/css-overflow-3/#overflow-properties)
    this.dropdown.on('hide.bs.dropdown', function () {
        this.input.focus();
        this.input.closest('.treeview')
            .css('overflow', '')
            .css('max-height', '');
        this.input.closest('.modal-body').css('overflow', '');
        this.input.closest('.navbar-collapse.in').css('overflow-y', '');
        this.input.closest('.content-box').css('overflow-y', '');
        //KALENIS => remove when https://codereview.tryton.org/314311002/patch/306451002/312361002 is applied
        this.input.closest('fieldset.form-group_').css('overflow', '');
        Sao.common.scrollIntoViewIfNeeded(this.input);
    }.bind(this));
    this.dropdown.on('show.bs.dropdown', function () {
        this.input.closest('.treeview')
            .css('overflow', 'visible')
            .css('max-height', 'none');
        this.input.closest('.modal-body').css('overflow', 'visible');
        this.input.closest('.navbar-collapse.in').css('overflow-y', 'visible');
        this.input.closest('.content-box').css('overflow-y', 'visible');
        //KALENIS => remove when https://codereview.tryton.org/314311002/patch/306451002/312361002 is applied
        this.input.closest('fieldset.form-group_').css('overflow', 'visible');
        Sao.common.scrollIntoViewIfNeeded(this.input);
    }.bind(this));
};

Sao.common.InputCompletion.prototype._set_selection = function (values) {
    if (values === undefined) {
        values = [];
    }
    this.menu.find('li.completion').remove();
    values.reverse().forEach(function (value) {
        jQuery('<li/>', {
            'class': 'completion'
        }).append(jQuery('<a/>', {
            'href': '#'
            //changed .text to .append, text fails if element is received
        }).append(this._format(value)))
            .click(function (evt) {
                evt.preventDefault();
                if (this.match_selected) {
                    this.match_selected(value);
                }
                this.input.focus();
            }.bind(this)).prependTo(this.menu);
    }, this);
    if (!this.input.val()) {
        if (this.dropdown.hasClass('open')) {
            this.menu.dropdown('toggle');
        }
    } else {
        if (!this.dropdown.hasClass('open')) {
            this.menu.dropdown('toggle');
        }
    }
};

////////////////END common.js ///////////

//tab.js

Sao.Tab.prototype.set_name= function(name) {
    var short_name = Sao.common.ellipsize(name.split(' / ').pop(), 20);
    this.name = short_name;
    this.name_el.text(short_name);
    this.name_el.attr('title', name);
};

Sao.Tab.Form.prototype.init = function (model_name, attributes) {
    Sao.Tab.Form._super.init.call(this, attributes);
    var screen = new Sao.Screen(model_name, attributes);
    screen.tab = this;
    this.screen = screen;
    this.info_bar = new Sao.Window.InfoBar();
    this.create_tabcontent();

    screen.message_callback = this.record_message.bind(this);
    screen.switch_callback = function () {
        if (this === Sao.Tab.tabs.get_current()) {
            Sao.set_url(this.get_url(), this.name);
        }
    }.bind(this);

    this.set_buttons_sensitive();

    this.view_prm = this.screen.switch_view().done(function () {
        this.screen.count_tab_domain();
        this.set_name(attributes.name || '');
        this.content.append(screen.screen_container.el);
        if (attributes.res_id) {
            if (!jQuery.isArray(attributes.res_id)) {
                attributes.res_id = [attributes.res_id];
            }
            screen.group.load(attributes.res_id);
            screen.current_record = screen.group.get(
                attributes.res_id);
            screen.display();
        } else {
            if (screen.current_view.view_type == 'form') {
                screen.new_();
            }



            //KALENIS: Prevent initial search on list_views, react will search when user_views are defined
            if (~['tree', 'graph', 'calendar'].indexOf(
                screen.current_view.view_type) && screen.current_view.view_context != 'list_view') {

                screen.search_filter();
            }
        }
        this.update_revision();
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
    if (attributes.model) {
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

Sao.Tab.prototype.create_toolbar = function () {
    //hide toolbar if kalenis_board in context. form-board views
    var toolbar_class = this.screen.context.kalenis_board ?
        'invisible'
        :
        'toolbar navbar navbar-default';

    var toolbar = jQuery('<nav/>', {
        'class': toolbar_class,
        'role': 'toolbar'
    }).append(jQuery('<div/>', {
        'class': 'container-fluid'
    }).append(jQuery('<div/>', {
        'class': 'dropdown navbar-header navbar-left flip'
    }).append(jQuery('<a/>', {
        'href': "#",
        'class': "navbar-brand dropdown-toggle",
        'data-toggle': 'dropdown',
        'role': 'button',
        'aria-expanded': false,
        'aria-haspopup': true
    }).append(jQuery('<span/>', {
        'class': 'title'
    })).append(jQuery('<span/>', {
        'class': 'caret'
    }))).append(jQuery('<ul/>', {
        'class': 'dropdown-menu',
        'role': 'menu'
    })).append(jQuery('<button/>', {
        'type': 'button',
        'class': 'close visible-xs',
        'aria-label': Sao.i18n.gettext('Close')
    }).append(jQuery('<span/>', {
        'aria-hidden': true
    }).append('&times;')).click(function () {
        this.close();
    }.bind(this)))).append(jQuery('<div/>', {
        'class': 'btn-toolbar navbar-right flip',
        'role': 'toolbar'
    })));
    this.set_menu(toolbar.find('ul[role*="menu"]'));

    var group;
    var add_button = function (item) {
        if (!item || !item.tooltip) {
            group = null;
            return;
        }
        if (!item.id || !this[item.id]) {
            return;
        }
        if (!group) {
            group = jQuery('<div/>', {
                'class': 'btn-group',
                'role': 'group'
            }).appendTo(toolbar.find('.btn-toolbar'));
        }
        var attributes = {
            'type': 'button',
            'class': 'btn btn-default navbar-btn',
            'title': item.label,
            'id': item.id
        };
        if (item.dropdown) {
            attributes['class'] += ' dropdown-toggle';
            attributes['data-toggle'] = 'dropdown';
            attributes['aria-expanded'] = false;
            attributes['aria-haspopup'] = true;
        }
        var button = jQuery('<button/>', attributes)
            .append(Sao.common.ICONFACTORY.get_icon_img(item.icon, {
                'aria-hidden': 'true',
                //kalenis added color
                'type': 'toolbar_icons'
            }));
        this.buttons[item.id] = button;
        if (item.dropdown) {
            var dropdown = jQuery('<div/>', {
                'class': 'btn-group dropdown',
                'role': 'group',
            }).append(button.append(jQuery('<span/>', {
                'class': 'caret',
            }))).append(jQuery('<ul/>', {
                'class': 'dropdown-menu',
                'role': 'menu',
                'aria-labelledby': item.id,
            })).appendTo(group);
        } else {
            button.appendTo(group);
        }
        this.buttons[item.id].click(item, function (event) {
            var item = event.data;
            var button = this.buttons[item.id];
            button.prop('disabled', true);
            (this[item.id](this) || jQuery.when())
                .always(function () {
                    button.prop('disabled', false);
                });
        }.bind(this));
    };
    this.menu_def().forEach(add_button.bind(this));
    this.status_label = jQuery('<span/>', {
        'class': 'badge',
    }).appendTo(jQuery('<div/>', {
        'class': 'navbar-text hidden-xs',
    }).insertAfter(this.buttons.previous));
    toolbar.find('.btn-toolbar > .btn-group').last()
        .addClass('hidden-xs')
        .find('.dropdown')
        .on('show.bs.dropdown', function () {
            jQuery(this).parents('.btn-group')
                .removeClass('hidden-xs');
        })
        .on('hide.bs.dropdown', function () {
            jQuery(this).parents('.btn-group')
                .addClass('hidden-xs');
        });
    return toolbar;
};

Sao.Tab.Form.prototype.create_toolbar = function () {
    var toolbar = Sao.Tab.Form._super.create_toolbar.call(this);
    var screen = this.screen;
    var buttons = this.buttons;
    var prm = screen.model.execute('view_toolbar_get', [],
        screen.context);
    prm.done(function (toolbars) {
        [
            ['action', 'tryton-launch',
                Sao.i18n.gettext('Launch action')],
            ['relate', 'tryton-link',
                Sao.i18n.gettext('Open related records')],
            ['print', 'tryton-print',
                Sao.i18n.gettext('Print report')]
        ].forEach(function (menu_action) {
            var button = jQuery('<div/>', {
                'class': 'btn-group dropdown',
                'role': 'group'
            })
                .append(jQuery('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-default navbar-btn dropdown-toggle',
                    'data-toggle': 'dropdown',
                    'aria-expanded': false,
                    'aria-haspopup': true,
                    'title': menu_action[2],
                    'id': menu_action[0],
                })
                    .append(Sao.common.ICONFACTORY.get_icon_img(
                        menu_action[1], {
                        'aria-hidden': 'true',
                        'type': 'toolbar_icons'
                    }))
                    .append(jQuery('<span/>', {
                        'class': 'caret'
                    })))
                .append(jQuery('<ul/>', {
                    'class': 'dropdown-menu',
                    'role': 'menu',
                    'aria-labelledby': menu_action[0]
                }))
                .appendTo(toolbar.find('.btn-toolbar > .btn-group').last());
            buttons[menu_action[0]] = button;
            var dropdown = button
                .on('show.bs.dropdown', function () {
                    jQuery(this).parents('.btn-group').removeClass(
                        'hidden-xs');
                }).on('hide.bs.dropdown', function () {
                    jQuery(this).parents('.btn-group').addClass(
                        'hidden-xs');
                });
            var menu = button.find('.dropdown-menu');
            button.click(function () {
                menu.find([
                    '.' + menu_action[0] + '_button',
                    '.divider-button',
                    '.' + menu_action[0] + '_plugin',
                    '.divider-plugin'].join(',')).remove();
                var buttons = screen.get_buttons().filter(
                    function (button) {
                        return menu_action[0] == (
                            button.attributes.keyword || 'action');
                    });
                if (buttons.length) {
                    menu.append(jQuery('<li/>', {
                        'role': 'separator',
                        'class': 'divider divider-button',
                    }));
                }
                buttons.forEach(function (button) {
                    var item = jQuery('<li/>', {
                        'role': 'presentation',
                        'class': menu_action[0] + '_button'
                    })
                        .append(
                            jQuery('<a/>', {
                                'role': 'menuitem',
                                'href': '#',
                                'tabindex': -1
                            }).append(
                                button.attributes.string || ''))
                        .click(function (evt) {
                            evt.preventDefault();
                            screen.button(button.attributes);
                        })
                        .appendTo(menu);
                });

                var kw_plugins = [];
                Sao.Plugins.forEach(function (plugin) {
                    plugin.get_plugins(screen.model.name).forEach(
                        function (spec) {
                            var name = spec[0],
                                func = spec[1],
                                keyword = spec[2] || 'action';
                            if (keyword != menu_action[0]) {
                                return;
                            }
                            kw_plugins.push([name, func]);
                        });
                });
                if (kw_plugins.length) {
                    menu.append(jQuery('<li/>', {
                        'role': 'separator',
                        'class': 'divider divider-plugin',
                    }));
                }
                kw_plugins.forEach(function (plugin) {
                    var name = plugin[0],
                        func = plugin[1];
                    jQuery('<li/>', {
                        'role': 'presentation',
                        'class': menu_action[0] + '_plugin',
                    }).append(
                        jQuery('<a/>', {
                            'role': 'menuitem',
                            'href': '#',
                            'tabindex': -1,
                        }).append(name))
                        .click(function (evt) {
                            evt.preventDefault();
                            var ids = screen.current_view.selected_records
                                .map(function (record) {
                                    return record.id;
                                });
                            var id = screen.current_record ?
                                screen.current_record.id : null;
                            func({
                                'model': screen.model.name,
                                'ids': ids,
                                'id': id,
                            });
                        })
                        .appendTo(menu);
                });
            });

            toolbars[menu_action[0]].forEach(function (action) {
                var item = jQuery('<li/>', {
                    'role': 'presentation'
                })
                    .append(jQuery('<a/>', {
                        'role': 'menuitem',
                        'href': '#',
                        'tabindex': -1
                    }).append(action.name))
                    .click(function (evt) {
                        evt.preventDefault();
                        var prm = jQuery.when();
                        if (this.screen.modified()) {
                            prm = this.save();
                        }
                        prm.then(function () {
                            var exec_action = jQuery.extend({}, action);
                            var record_id = null;
                            if (screen.current_record) {
                                record_id = screen.current_record.id;
                            }
                            var record_ids = screen.current_view
                                .selected_records.map(function (record) {
                                    return record.id;
                                });
                            exec_action = Sao.Action.evaluate(exec_action,
                                menu_action[0], screen.current_record);
                            var data = {
                                model: screen.model_name,
                                id: record_id,
                                ids: record_ids
                            };
                            Sao.Action.exec_action(exec_action, data,
                                jQuery.extend({}, screen.group._context));
                        });
                    }.bind(this))
                    .appendTo(menu);
            }.bind(this));

            if (menu_action[0] == 'print') {
                if (toolbars.exports.length && toolbars.print.length) {
                    menu.append(jQuery('<li/>', {
                        'role': 'separator',
                        'class': 'divider',
                    }));
                }
                toolbars.exports.forEach(function (export_) {
                    var item = jQuery('<li/>', {
                        'role': 'presentation',
                    })
                        .append(jQuery('<a/>', {
                            'role': 'menuitem',
                            'href': '#',
                            'tabindex': -1,
                        }).append(export_.name))
                        .click(function (evt) {
                            evt.preventDefault();
                            this.do_export(export_);
                        }.bind(this))
                        .appendTo(menu);
                }.bind(this));
            }
        }.bind(this));
    }.bind(this));
    this.buttons.attach
        .on('dragover', false)
        .on('drop', this.attach_drop.bind(this));
    return toolbar;
};


Sao.Tab.Form.prototype._close_allowed = function () {

    if (this.screen.context.kalenis_board) {
        return jQuery.when();
    }
    return this.modified_save();
};


//Add react components unmount
Sao.Tab.prototype.close = function () {

    var tabs = jQuery('#tabs');
    var tablist = jQuery('#tablist');
    var tab = tablist.find('#nav-' + this.id);
    var content = tabs.find('#' + this.id);
    var react_tree = content.find('[id*="_addon"]');
    this.show();
    return this._close_allowed().then(function () {
        var next = tab.nextAll('li').first();
        if (!next.length) {
            next = tab.prevAll('li').first();
        }
        tab.remove();
        content.remove();
        var i = Sao.Tab.tabs.indexOf(this);
        if (i >= 0) {
            Sao.Tab.tabs.splice(i, 1);
        }
        if (next.length) {
            next.find('a').tab('show');
        } else {
            Sao.set_url();
        }
        tabs.trigger('ready');
        //kalenis

        react_tree.each(function (i, element) {

            var deleted = Sao.KalenisAddons.Components.delete(element);

        });
    }.bind(this));
};


// Sao.js

//ToRemove => : Added until https://github.com/fullcalendar/fullcalendar/pull/5391 get merged
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi;
jQuery.htmlPrefilter = function (html) {
    return html.replace(rxhtmlTag, "<$1></$2>");
};

Sao.user_menu = function (preferences) {
    jQuery('#user-preferences').empty();
    jQuery('#user-favorites').empty();
    jQuery('#user-logout').empty();
    jQuery('#user-preferences').append(jQuery('<a/>', {
        'href': '#',
        'title': preferences.status_bar,
    }).click(function (evt) {
        evt.preventDefault();
        Sao.preferences();
    }).append(preferences.status_bar));
    var title = Sao.i18n.gettext("Logout");
    jQuery('#user-logout').append(jQuery('<a/>', {
        'href': '#',
        'title': title,
        'aria-label': title,
    }).click(Sao.logout).append(
        Sao.common.ICONFACTORY.get_icon_img('tryton-exit', {
            'class': 'icon hidden-xs',
            'aria-hidden': true,
            'type': 'toolbar_icons'
        })).append(jQuery('<span/>', {
            'class': 'visible-xs',
        }).text(title)));
};



//window.js

Sao.Window.Form.prototype.init = function (screen, callback, kwargs) {
    kwargs = kwargs || {};
    this.screen = screen;
    this.callback = callback;
    this.many = kwargs.many || 0;
    this.domain = kwargs.domain || null;
    this.context = kwargs.context || null;
    this.save_current = kwargs.save_current;
    var title_prm = jQuery.when(kwargs.title || '');
    title_prm.then(function (title) {
        this.title = title;
    }.bind(this));

    this.prev_view = screen.current_view;
    this.screen.screen_container.alternate_view = true;
    this.info_bar = new Sao.Window.InfoBar();
    var view_type = kwargs.view_type || 'form';

    this.switch_prm = this.screen.switch_view(view_type)
        .done(function () {
            if (kwargs.new_ &&
                (this.screen.current_view.view_type == view_type)) {
                this.screen.new_(undefined, kwargs.rec_name);
            }
        }.bind(this));
    var dialog = new Sao.Dialog('', 'window-form', 'lg', false);
    this.el = dialog.modal;
    this.el.on('keydown', function (e) {
        if (e.which == Sao.common.ESC_KEYCODE) {
            e.preventDefault();
            this.response('RESPONSE_CANCEL');
        }
    }.bind(this));

    var readonly = (this.screen.attributes.readonly ||
        this.screen.group.readonly);

    this._initial_value = null;
    if (view_type == 'form') {
        var button_text;
        if (kwargs.new_) {
            button_text = Sao.i18n.gettext('Delete');
        } else {
            button_text = Sao.i18n.gettext('Cancel');
            this._initial_value = this.screen.current_record.get_eval();
        }

        dialog.footer.append(jQuery('<button/>', {
            'class': 'btn btn-link',
            'type': 'button'
        }).append(button_text).click(function () {
            this.response('RESPONSE_CANCEL');
        }.bind(this)));
    }

    if (kwargs.new_ && this.many) {
        dialog.footer.append(jQuery('<button/>', {
            'class': 'btn btn-default',
            'type': 'button'
        }).append(Sao.i18n.gettext('New')).click(function () {
            this.response('RESPONSE_ACCEPT');
        }.bind(this)));
    }

    if (this.save_current) {
        dialog.footer.append(jQuery('<button/>', {
            'class': 'btn btn-primary',
            'type': 'submit'
        }).append(Sao.i18n.gettext('Save')));
    } else {
        dialog.footer.append(jQuery('<button/>', {
            'class': 'btn btn-primary',
            'type': 'submit'
        }).append(Sao.i18n.gettext('OK')));
    }
    dialog.content.submit(function (e) {
        this.response('RESPONSE_OK');
        e.preventDefault();
    }.bind(this));

    if (view_type == 'tree') {
        var menu = jQuery('<div/>', {
            'class': 'window-form-toolbar'
        }).appendTo(dialog.body);
        var group = jQuery('<div/>', {
            'class': 'input-group input-group-sm'
        }).appendTo(menu);

        this.wid_text = jQuery('<input/>', {
            type: 'input'
        }).appendTo(menu);
        this.wid_text.hide();

        var buttons = jQuery('<div/>', {
            'class': 'input-group-btn'
        }).appendTo(group);
        var access = Sao.common.MODELACCESS.get(this.screen.model_name);

        this.but_switch = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('Switch')
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-switch', {
            'aria-hidden': 'true',
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_switch.click(this.switch_.bind(this));

        this.but_previous = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('Previous')
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-back', {
            'aria-hidden': 'true',
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_previous.click(this.previous.bind(this));

        this.label = jQuery('<span/>', {
            'class': 'badge'
        }).appendTo(jQuery('<span/>', {
            'class': 'btn hidden-xs',
        }).appendTo(buttons));

        this.but_next = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('Next')
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-forward', {
            'aria-hidden': 'true',
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_next.click(this.next.bind(this));

        if (this.domain) {
            this.wid_text.show();

            this.but_add = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'aria-label': Sao.i18n.gettext('Add')
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add', {
                'aria-hidden': 'true',
                //kalenis added color
                'type': 'toolbar_icons'
            })
            ).appendTo(buttons);
            this.but_add.click(this.add.bind(this));
            this.but_add.prop('disabled', !access.read || readonly);

            this.but_remove = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'aria-label': Sao.i18n.gettext('Remove')
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove', {
                'aria-hidden': 'true',
                //kalenis added color
                'type': 'toolbar_icons'
            })
            ).appendTo(buttons);
            this.but_remove.click(this.remove.bind(this));
            this.but_remove.prop('disabled', !access.read || readonly);
        }

        this.but_new = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('New')
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-create', {
            'aria-hidden': 'true',
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_new.click(this.new_.bind(this));
        this.but_new.prop('disabled', !access.create || readonly);

        this.but_del = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('Delete')
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-delete', {
            'aria-hidden': 'true',
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_del.click(this.delete_.bind(this));
        this.but_del.prop('disabled', !access['delete'] || readonly);

        this.but_undel = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('Undelete')
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-undo', {
            'aria-hidden': 'true',
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_undel.click(this.undelete.bind(this));
        this.but_undel.prop('disabled', !access['delete'] || readonly);

        this.screen.message_callback = this.record_label.bind(this);
    }

    var content = jQuery('<div/>').appendTo(dialog.body);

    dialog.body.append(this.info_bar.el);

    this.switch_prm.done(function () {
        if (this.screen.current_view.view_type != view_type) {
            this.destroy();
        } else {
            title_prm.done(dialog.add_title.bind(dialog));
            content.append(this.screen.screen_container.alternate_viewport);
            this.el.modal('show');
        }
    }.bind(this));
    this.el.on('shown.bs.modal', function (event) {
        this.screen.display().done(function () {
            this.screen.set_cursor();
        }.bind(this));
    }.bind(this));
    this.el.on('hidden.bs.modal', function (event) {
        jQuery(this).remove();
    });
};



// /view/form.js

// Sao.View.Form.Date.prototype.init = function (view, attributes) {
//     Sao.View.Form.Date._super.init.call(this, view, attributes);
//     this.el = jQuery('<div/>', {
//         'class': this.class_
//     });
//     this.date = this.labelled = jQuery('<div/>', {
//         'class': ('input-group input-group-sm ' +
//             'input-icon input-icon-primary'),
//     }).appendTo(this.el);
//     Sao.common.ICONFACTORY.get_icon_img('tryton-date')
//         .appendTo(jQuery('<div/>', {
//             'class': 'datepickerbutton icon-input icon-primary',
//             'aria-label': Sao.i18n.gettext("Open the calendar"),
//             'title': Sao.i18n.gettext("Open the calendar"),
//         }).appendTo(this.date));
//     this.input = jQuery('<input/>', {
//         'type': 'text',
//         'class': 'form-control input-sm mousetrap'
//     }).appendTo(this.date);
//     this.date.datetimepicker({
//         'locale': moment.locale(),
//         'keyBinds': null,
//         'useCurrent': false,
//     });
//     this.date.css('max-width', this._width);
//     this.date.on('dp.change', this.focus_out.bind(this));
//     // We must set the overflow of the treeview and modal-body
//     // containing the input to visible to prevent vertical scrollbar
//     // inherited from the auto overflow-x
//     // (see http://www.w3.org/TR/css-overflow-3/#overflow-properties)
//     this.date.on('dp.hide', function () {
//         this.date.closest('.treeview').css('overflow', '');
//         this.date.closest('.modal-body').css('overflow', '');
//         this.date.closest('.form-group_').css('overflow', 'auto');
//         //kalenis: set overflow to content box, avoid y scroll on calendar
//         this.date.closest('.content-box').css('overflow', '');
//     }.bind(this));
//     this.date.on('dp.show', function () {
//         this.date.closest('.treeview').css('overflow', 'visible');
//         this.date.closest('.modal-body').css('overflow', 'visible');
//         this.date.closest('.form-group_').css('overflow', 'visible');
//         //kalenis: set overflow to content box, avoid y scroll on calendar
//         this.date.closest('.content-box').css('overflow', 'visible');
//     }.bind(this));
//     var mousetrap = new Mousetrap(this.el[0]);

//     mousetrap.bind('enter', function (e, combo) {
//         if (!this.date.find('input').prop('readonly')) {
//             this.date.data('DateTimePicker').date();
//         }
//     }.bind(this));
//     mousetrap.bind('=', function (e, combo) {
//         if (!this.date.find('input').prop('readonly')) {
//             e.preventDefault();
//             this.date.data('DateTimePicker').date(moment());
//         }
//     }.bind(this));

//     Sao.common.DATE_OPERATORS.forEach(function (operator) {
//         mousetrap.bind(operator[0], function (e, combo) {
//             if (this.date.find('input').prop('readonly')) {
//                 return;
//             }
//             e.preventDefault();
//             var dp = this.date.data('DateTimePicker');
//             var date = dp.date();
//             date.add(operator[1]);
//             dp.date(date);
//         }.bind(this));
//     }.bind(this));
// };
Sao.View.Form.One2Many.prototype.init = function (view, attributes) {
    Sao.View.Form.One2Many._super.init.call(this, view, attributes);

    this._readonly = true;
    this._required = false;
    this._position = 0;
    this._length = 0;

    this.el = jQuery('<div/>', {
        'class': this.class_ + ' panel panel-default'
    });
    this.menu = jQuery('<div/>', {
        'class': this.class_ + '-menu panel-heading'
    });
    this.el.append(this.menu);

    this.title = jQuery('<label/>', {
        'class': this.class_ + '-string',
        text: attributes.string
    });
    this.menu.append(this.title);

    this.title.uniqueId();
    this.el.uniqueId();
    this.el.attr('aria-labelledby', this.title.attr('id'));
    this.title.attr('for', this.el.attr('id'));

    var toolbar = jQuery('<div/>', {
        'class': this.class_ + '-toolbar'
    });
    this.menu.append(toolbar);

    var group = jQuery('<div/>', {
        'class': 'input-group input-group-sm'
    }).appendTo(toolbar);

    var buttons = jQuery('<div/>', {
        'class': 'input-group-btn'
    }).appendTo(group);

    this.but_switch = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Switch"),
        'title': Sao.i18n.gettext("Switch"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-switch', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_switch.click(this.switch_.bind(this));

    this.but_previous = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Previous"),
        'title': Sao.i18n.gettext("Previous"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-back', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_previous.click(this.previous.bind(this));

    this.label = jQuery('<span/>', {
        'class': 'badge',
    }).appendTo(jQuery('<span/>', {
        'class': 'btn hidden-xs',
    }).appendTo(buttons));

    this.but_next = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Next"),
        'title': Sao.i18n.gettext("Next"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-forward', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_next.click(this.next.bind(this));

    if (attributes.add_remove) {
        this.wid_text = jQuery('<input/>', {
            type: 'text',
            'class': 'form-control input-sm'
        }).appendTo(group);
        // TODO add completion
        //
        //
        buttons = jQuery('<div/>', {
            'class': 'input-group-btn',
        }).appendTo(group);

        this.but_add = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'tabindex': -1,
            'aria-label': Sao.i18n.gettext("Add"),
            'title': Sao.i18n.gettext("Add"),
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add', {
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_add.click(this.add.bind(this));

        this.but_remove = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'tabindex': -1,
            'aria-label': Sao.i18n.gettext("Remove"),
            'title': Sao.i18n.gettext("Remove"),
        }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove', {
            //kalenis added color
            'type': 'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_remove.click(this.remove.bind(this));
    }

    this.but_new = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("New"),
        'title': Sao.i18n.gettext("New"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-create', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_new.click(this.new_.bind(this));

    this.but_open = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Open"),
        'title': Sao.i18n.gettext("Open"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-open', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_open.click(this.open.bind(this));

    this.but_del = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Delete"),
        'title': Sao.i18n.gettext("Delete"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-delete', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_del.click(this.delete_.bind(this));

    this.but_undel = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Undelete"),
        'title': Sao.i18n.gettext("Undelete"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-undo', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_undel.click(this.undelete.bind(this));

    this.content = jQuery('<div/>', {
        'class': this.class_ + '-content panel-body'
    });
    this.el.append(this.content);

    var modes = (attributes.mode || 'tree,form').split(',');
    this.screen = new Sao.Screen(attributes.relation, {
        mode: modes,
        view_ids: (attributes.view_ids || '').split(','),
        views_preload: attributes.views || {},
        row_activate: this.activate.bind(this),
        exclude_field: attributes.relation_field || null,
        limit: null,
        pre_validate: attributes.pre_validate,
        //kalenis
        field_type: 'o2m',
        field_name: this.el.attr('id'),
        field_instance: this,

    });
    this.screen.pre_validate = attributes.pre_validate == 1;

    this.screen.message_callback = this.record_label.bind(this);
    this.prm = this.screen.switch_view(modes[0]).done(function () {
        this.content.append(this.screen.screen_container.el);
    }.bind(this));

    // TODO key_press

    this.but_switch.prop('disabled', this.screen.number_of_views <= 0);
};

//set recover scroll for o2m
Sao.View.Form.One2Many.prototype.activate = function (event_) {
    this.screen._recoverScroll = true;
    this.edit();
};

Sao.View.Form.One2Many.prototype.set_required = function (required) {

    if (!required && this.field) {
        var state_attrs = this.field.get_state_attrs(this.record);
        if (state_attrs.required) {
            required = state_attrs.required;
        }

    }

    if (required !== this._required) {
        this._required = required;

        if (this.field) {
            this.field.set_state(this.record);
        }

        this._set_label_state();

    }


};


//Kalenis => Completion
Sao.View.Form.Many2Many.prototype._update_completion = function () {
    
    return Sao.common.update_completion(this.entry, this.record, this.field, this.field.description.relation);

};
//Kalenis => Completion
Sao.View.Form.Many2Many.prototype._completion_match_selected = function (value) {
    
    var ids = [];
    if (value) {
        ids.push(value.id);
        this.screen.group.load(ids, true);
        this.screen.display();
        this.entry.val('');
    }



};
//Kalenis => Completion
Sao.View.Form.Many2Many.prototype._completion_action_activated = function (action) {
    
    switch(action){
        case 'search':
            this.add();
            break;
        case 'create':
            
            this._new();
            break;
        default:
            break;

    }

};

Sao.View.Form.Many2Many.prototype.get_screen= function() {
    var domain = this.field.get_domain(this.record);
    var context = this.field.get_context(this.record);
    var view_ids = (this.attributes.view_ids || '').split(',');
    if (!jQuery.isEmptyObject(view_ids)) {
        // Remove the first tree view as mode is form only
        view_ids.shift();
    }
    return new Sao.Screen(this.attributes.relation, {
        'context': context,
        'domain': domain,
        'mode': ['form'],
        'view_ids': view_ids,
        'views_preload': this.attributes.views,
        'readonly': this._readonly
    });
};

Sao.View.Form.Many2Many.prototype._new = function(evt) {
    var model = this.attributes.relation;
    if (!model || ! Sao.common.MODELACCESS.get(model).create) {
        return;
    }

    

    var screen = this.get_screen();
    var callback = function(result) {
        if (result) {
            var rec_name_prm = screen.current_record.rec_name();
            rec_name_prm.done(function(name) {
                
                this._completion_match_selected({'id':screen.current_record.id});
            }.bind(this));
        }
    };
    var rec_name = this.entry.val();
    screen.switch_view().done(function() {
        var win = new Sao.Window.Form(screen, callback.bind(this), {
            new_: true,
            save_current: true,
            title: this.attributes.string,
            rec_name: rec_name
        });
    }.bind(this));
};


Sao.View.Form.Many2Many.prototype.init = function (view, attributes) {
    //kalenis Method
    Sao.View.Form.Many2Many._super.init.call(this, view, attributes);

    this._readonly = true;
    this._required = false;
    this._position = 0;

    this.el = jQuery('<div/>', {
        'class': this.class_ + ' panel panel-default'
    });
    this.menu = jQuery('<div/>', {
        'class': this.class_ + '-menu panel-heading'
    });
    this.el.append(this.menu);

    this.title = jQuery('<label/>', {
        'class': this.class_ + '-string',
        text: attributes.string
    });
    this.menu.append(this.title);





    this.title.uniqueId();
    this.el.uniqueId();
    this.el.attr('aria-labelledby', this.title.attr('id'));
    this.title.attr('for', this.el.attr('id'));




    var toolbar = jQuery('<div/>', {
        'class': this.class_ + '-toolbar'
    });
    this.menu.append(toolbar);

    var group = jQuery('<div/>', {
        'class': 'input-group input-group-sm'
    }).appendTo(toolbar);



    this.entry = jQuery('<input/>', {
        type: 'text',
        'class': 'form-control input-sm mousetrap'
    }).appendTo(group);
    // Use keydown to not receive focus-in TAB
    this.entry.on('keydown', this.key_press.bind(this));

    // TODO completion
    //Kalenis => Completion

    Sao.common.get_completion(group,
        this._update_completion.bind(this),
        this._completion_match_selected.bind(this),
        this._completion_action_activated.bind(this));
    this.wid_completion = true;


    var buttons = jQuery('<div/>', {
        'class': 'input-group-btn'
    }).appendTo(group);

    //kalenis


    this.label = jQuery('<span/>', {
        'class': 'badge m2m-counter',
        'text': '0'
    }).appendTo(jQuery('<div/>', {
        'class': 'btn',
    }));

    this.label.attr('id', this.el.attr('id').concat('_counter'));
    buttons.append(this.label);



    //kalenis



    this.but_add = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Add"),
        'title': Sao.i18n.gettext("Add"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_add.click(this.add.bind(this));

    this.but_remove = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Remove"),
        'title': Sao.i18n.gettext("Remove"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove', {
        //kalenis added color
        'type': 'toolbar_icons'
    })
    ).appendTo(buttons);
    this.but_remove.click(this.remove.bind(this));

    this.content = jQuery('<div/>', {
        'class': this.class_ + '-content panel-body'
    });
    this.el.append(this.content);

    this.screen = new Sao.Screen(attributes.relation, {
        mode: ['tree'],
        view_ids: (attributes.view_ids || '').split(','),
        views_preload: attributes.views || {},
        row_activate: this.activate.bind(this),
        limit: null,
        //kalenis: added field name and types for render improvement
        field_name: this.el.attr('id'),
        field_type: 'm2m',
        field_instance: this
    });
    this.screen.message_callback = this.record_label.bind(this);
    this.prm = this.screen.switch_view('tree').done(function () {
        this.content.append(this.screen.screen_container.el);
    }.bind(this));
};



// Form HTML Widget
Sao.View.Form.HTML.prototype.init = function (view, attributes) {
    Sao.View.Form.HTML._super.init.call(this, view, attributes);
    this.attributes = attributes;
    Sao.View.Form.TranslateMixin.init.call(this);
    this.el = jQuery('<div/>', {
        'class': this.class_,
    });
    this.el.uniqueId();

    this.el.attr('id', this.el.attr('id').concat('_addon'));
    this.button = jQuery('<a/>', {
        'class': 'btn btn-lnk',
        'target': '_blank',
        'rel': 'noreferrer noopener',
    }).text(attributes.string).appendTo(this.el);
    if (attributes.translate) {
        var button = jQuery('<button/>', {
            'class': 'btn btn-default btn-sm',
            'type': 'button',
            'aria-label': Sao.i18n.gettext('Translate'),
        }).appendTo(this.el);
        button.append(
            Sao.common.ICONFACTORY.get_icon_img('tryton-translate'));
        button.click(this.translate.bind(this));
    }
};

Sao.View.Form.HTML.prototype.display = function () {
    Sao.View.Form.HTML._super.display.call(this);
    var value = "";
    if(this.field){
        
        if(this.record){
            value = this.record._values[this.field.description.name];
            
        }
    }
    
    

    Sao.KalenisAddons.Components.createHtmlField({
        element: this.el[0], sao_props: {
            field: this.field,
            record: this.record,
            attributes: this.attributes,
            screen: this.view.screen,
            value:value
        }
    });

};

// End form html widget

Sao.View.Form.prototype.init = function (view_id, screen, xml) {
    this.el = jQuery('<div/>', {
        'class': 'form',
    });
    //add extra margin if kalenis_board on context
    if (screen) {
        if (screen.context.kalenis_board) {
            this.el.css("margin-top", "5px");
        }
    }
    this.notebooks = [];
    this.expandables = [];
    this.containers = [];
    this.widget_id = 0;
    Sao.View.Form._super.init.call(this, view_id, screen, xml);
};

Sao.View.Form.TranslateDialog.prototype.read = function (widget, dialog) {
    function field_value(result) {
        return result[0][widget.field_name] || '';
    }
    this.languages.forEach(function (lang) {
        var value;
        var row = jQuery('<div/>', {
            'class': 'row form-group'
        });
        var input = widget.translate_widget();
        input.attr('data-lang-id', lang.id);
        var checkbox = jQuery('<input/>', {
            'type': 'checkbox',
            'title': Sao.i18n.gettext('Edit')
        });
        //Kalenis: Check for field states to set edit checkbox on readonly
        var state_attrs = widget.field.get_state_attrs(widget.record);
        if (state_attrs.readonly) {
            checkbox.attr('disabled', true);
        }
        var fuzzy_box = jQuery('<input/>', {
            'type': 'checkbox',
            'disabled': true,
            'title': Sao.i18n.gettext('Fuzzy')
        });
        var prm1 = Sao.rpc({
            'method': 'model.' + widget.model.name + '.read',
            'params': [
                [widget.record.id],
                [widget.field_name],
                { language: lang.code },
            ],
        }, widget.model.session).then(field_value);
        var prm2 = Sao.rpc({
            'method': 'model.' + widget.model.name + '.read',
            'params': [
                [widget.record.id],
                [widget.field_name],
                {
                    language: lang.code,
                    fuzzy_translation: true,
                },
            ],
        }, widget.model.session).then(field_value);

        jQuery.when(prm1, prm2).done(function (value, fuzzy_value) {
            widget.translate_widget_set(input, fuzzy_value);
            widget.translate_widget_set_readonly(input, true);
            fuzzy_box.attr('checked', value !== fuzzy_value);
        });
        checkbox.click(function () {
            widget.translate_widget_set_readonly(
                input, !jQuery(this).prop('checked'));
        });
        dialog.body.append(row);
        row.append(jQuery('<div/>', {
            'class': 'col-sm-2'
        }).append(lang.name));
        row.append(jQuery('<div/>', {
            'class': 'col-sm-8'
        }).append(input));
        row.append(jQuery('<div/>', {
            'class': 'col-sm-1'
        }).append(checkbox));
        row.append(jQuery('<div/>', {
            'class': 'col-sm-1'
        }).append(fuzzy_box));
    }.bind(this));
};

// END /view/form.js


// view.js

Sao.View.parse = function (screen, view_id, type, xml, children_field) {
    //kalenis
    switch (type) {
        case 'tree': {
            if (children_field === null) {
                return new Sao.View.KalenisTree(view_id, screen, xml, children_field);
                // return new Sao.View.Tree(view_id, screen, xml, children_field);
            }
            else {
                return new Sao.View.Tree(view_id, screen, xml, children_field);
            }
            break;
        }
        case 'form':
            return new Sao.View.Form(view_id, screen, xml);
        case 'graph':
            return new Sao.View.Graph(view_id, screen, xml);
        case 'calendar':
            return new Sao.View.Calendar(view_id, screen, xml);
        case 'list-form':
            return new Sao.View.ListForm(view_id, screen, xml);
    }
};

//END view.js 

// model.js

Sao.Record.prototype.loadRange = function (name, view_limit, force_eager, grid_fields, prefixes, extra_fields) {

    var prm;

    if ((this.id < 0) || (name in this._loaded) && !grid_fields) {

        return jQuery.when();
    }


    //Re check
    // if (this.group.prm.state() == 'pending') {
    //     return this.group.prm.then(function() {
    //         
    //         return this.loadRange(name, view_limit, force_eager, grid_fields, prefixes);
    //     }.bind(this));
    // }


    var id2record = {};
    id2record[this.id] = this;
    var loading;

    if (force_eager) {
        loading = 'eager';
    }




    var fnames = [];
    var rec_named_fields = ['many2one', 'one2one', 'reference'];


    grid_fields.map(function (field) {
        // if (!(field.attributes.name in this._loaded) ) {
        if (field.type === "field") {
            fnames.push(field.attributes.name);

            if (~(rec_named_fields.indexOf(field.field.description.type))) {
                fnames.push(field.attributes.name + '.rec_name');
            }
        }


    }.bind(this));

    // if (!~fnames.indexOf('rec_name')) {
    //     fnames_to_fetch.push('rec_name');
    // }
    fnames.push('_timestamp');

    if (prefixes && prefixes.length > 0) {

        prefixes.map(function (pref) {
            fnames.push(pref);
        });
    }

    if (extra_fields && extra_fields.length > 0) {
        extra_fields.map(function (field) {
            fnames.push(field);
        });
    }



    var context = jQuery.extend({}, this.get_context());



    //Kalenis
    var limit;
    if (view_limit) {
        limit = parseInt((view_limit), 10);

    }
    // else{
    //     limit = parseInt(Sao.config.limit / fnames_to_fetch.length,
    //             10);  
    // }






    var filter_group = function (record) {

        var to_load = grid_fields.length;
        var loaded = Object.keys(record._loaded).length;

        return true;
        // return !(name in record._loaded) && (record.id >= 0);
    };
    var filter_parent_group = function (record) {
        return (filter_group(record) &&
            (id2record[record.id] === undefined) &&
            ((record.group === this.group) ||
                // Don't compute context for same group
                (JSON.stringify(record.get_context()) ===
                    JSON.stringify(context))));
    }.bind(this);
    var group, filter;
    if (this.group.parent &&
        (this.group.parent.model.name == this.model.name)) {
        group = [];
        group = group.concat.apply(
            group, this.group.parent.group.children);
        filter = filter_parent_group;
    } else {
        group = this.group;
        filter = filter_group;
    }
    var idx = group.indexOf(this);


    if (~idx) {
        var n = 0;
        var slicedGroup = group.slice(idx, idx + limit);


        slicedGroup.map(function (record) {
            n++;
            if (record.id > 0) {
                id2record[record.id] = record;
            }

        });


    }

    prm = this.model.execute('read', [Object.keys(id2record).map(
        function (e) { return parseInt(e, 10); }),
        fnames], context);
    var succeed = function (values, exception) {
        if (exception === undefined) exception = false;
        var id2value = {};
        var promises = [];
        values.forEach(function (e, i, a) {
            id2value[e.id] = e;
        });
        for (var id in id2record) {
            if (!id2record.hasOwnProperty(id)) {
                continue;
            }
            var record = id2record[id];
            if (!record.exception) {
                record.exception = exception;
            }
            var value = id2value[id];
            if (record && value) {
                for (var key in this._changed) {
                    if (!this._changed.hasOwnProperty(key)) {
                        continue;
                    }
                    delete value[key];
                }
                promises.push(record.set(value));
            }
        }

        return jQuery.when.apply(jQuery, promises);
    }.bind(this);
    var failed = function () {

        var failed_values = [];
        var default_values;
        for (var id in id2record) {
            default_values = {
                id: id
            };
            for (var i in fnames) {
                default_values[fnames[i]] = null;
            }
            failed_values.push(default_values);
        }
        return succeed(failed_values, true);
    };
    this.group.prm = prm.then(succeed, failed);
    return this.group.prm;
};

Sao.Record.prototype.set_on_change = function (values) {
    var fieldname, value;


    for (fieldname in values) {
        value = values[fieldname];
        if (!(fieldname in this.model.fields)) {
            continue;
        }
        if ((this.model.fields[fieldname] instanceof
            Sao.field.Many2One) ||
            (this.model.fields[fieldname] instanceof
                Sao.field.Reference)) {
            var related = fieldname + '.';
            //kalenis: The original version doesnt add the values, instead, it perform multiple reads. 
            // this increase perf
            var rec_name = fieldname + '.rec_name';
            // this._values[related] = values[related] || {};

            this._values[related] = { id: values[fieldname], rec_name: values[rec_name] };



        }

        //kalenis: Fixes domains calculated in o2m/m2m  empty values. The original version creates multiples requests


        if (this.model.fields[fieldname] instanceof Sao.field.One2Many) {
            if (value instanceof Array) {
                if (value.length === 0) {

                    this._values[fieldname] = undefined;

                    // return this.model.fields[fieldname].set_default(this, []);

                }
            }
        }



        this.model.fields[fieldname].set_on_change(this, value);
    }
};

Sao.field.Float.prototype.get_client = function (record, factor) {
    if (factor === undefined) {
        factor = 1;
    }
    var value = this.get(record);
    if (value !== null) {
        var options = {};
        var digits = this.digits(record, factor);
        if (digits) {
            options.minimumFractionDigits = digits[1];
            options.maximumFractionDigits = digits[1];
        }
        //kalenis: Force lang to en if decimal_point is .
        var lang = Sao.i18n.BC47(Sao.i18n.getlang());
        if (Sao.i18n.locale) {
            if (Sao.i18n.locale.decimal_point === '.') {
                lang = 'en';
            }
        }

        return (value * factor).toLocaleString(
            lang, options);
    } else {
        return '';
    }
};

function time_format(field,record){
    var context = field.get_context(record);
    var format = "";
    
    if (context.locale && context.locale.time) {
        format = Sao.common.moment_format(context.locale.time);
    }
    else {
        format = record.expr_eval(field.description.format);
    }
    return format;
}

Sao.field.DateTime.prototype.time_format = function (record){
   
    return time_format(this,record);
};

Sao.field.Time.prototype.time_format = function(record){
    return time_format(this,record);
};

Sao.field.DateTime.prototype.set_client = function (record, value, force_change) {

    var current_value;
    if (value) {
        if (value.isTime) {

            current_value = this.get(record);
            if (current_value) {

                value = Sao.DateTime.combine(current_value, value);
            } else {
                value = null;
            }
        } else if (value.isDate) {

            current_value = this.get(record);
            if (current_value) {

                value = Sao.DateTime.combine(value, current_value);
            }
            //Add default time value if no time is supplied. Prevent to crash on empty records
            else {
                value = Sao.DateTime.combine(value, moment());
            }
        }
    }
    Sao.field.DateTime._super.set_client.call(this, record, value,
        force_change);
};

Sao.field.One2Many.prototype.validate = function (record, softvalidation, pre_validate) {

    var invalid = false;
    var inversion = new Sao.common.DomainInversion();
    var ldomain = inversion.localize_domain(inversion.domain_inversion(
        record.group.clean4inversion(pre_validate || []), this.name,
        Sao.common.EvalEnvironment(record)), this.name);
    if (typeof ldomain == 'boolean') {
        if (ldomain) {
            ldomain = [];
        } else {
            ldomain = [['id', '=', null]];
        }
    }
    for (var i = 0, len = (record._values[this.name] || []).length;
        i < len; i++) {
        var record2 = record._values[this.name][i];
        if (!record2.get_loaded() && (record2.id >= 0) &&
            !pre_validate) {
            continue;
        }
        if (!record2.validate(null, softvalidation, ldomain, true)) {
            invalid = 'children';
        }
    }

    var test = Sao.field.One2Many._super.validate.call(this, record,
        softvalidation, pre_validate);
    if (test && invalid) {
        this.get_state_attrs(record).invalid = invalid;
        return false;
    }
    //kalenis: Return false if lines are empty and field is required. Prevent extra network request.
    if (this.get_state_attrs(record).required) {
        if ((record._values[this.name] || []).length === 0) {

            this.get_state_attrs(record).invalid = "required";
            return false;
        }
    }

    return test;
};

Sao.Record.prototype.on_change_with = function (field_names) {

    var fieldnames = {};
    var values = {};
    var later = {};
    var fieldname, on_change_with;
    for (fieldname in this.model.fields) {
        if (!this.model.fields.hasOwnProperty(fieldname)) {
            continue;
        }
        on_change_with = this.model.fields[fieldname]
            .description.on_change_with;
        if (jQuery.isEmptyObject(on_change_with)) {
            continue;
        }
        for (var i = 0; i < field_names.length; i++) {
            if (~on_change_with.indexOf(field_names[i])) {
                break;
            }
        }
        if (i >= field_names.length) {
            continue;
        }
        if (!jQuery.isEmptyObject(Sao.common.intersect(
            Object.keys(fieldnames).sort(),
            on_change_with.sort()))) {
            later[fieldname] = true;
            continue;
        }
        fieldnames[fieldname] = true;
        values = jQuery.extend(values,
            this._get_on_change_args(on_change_with));
        if ((this.model.fields[fieldname] instanceof
            Sao.field.Many2One) ||
            (this.model.fields[fieldname] instanceof
                Sao.field.Reference)) {
            delete this._values[fieldname + '.'];
        }
    }
    var result;
    fieldnames = Object.keys(fieldnames);
    if (fieldnames.length) {
        try {
            //Kalenis: Avoid to use single on_change_with in worksheets, solves bug with multiple workers
            if (fieldnames.length == 1 && this.model.name !=
                'lims.interface.data') {
                fieldname = fieldnames[0];
                result = {};
                result[fieldname] = this.model.execute(
                    'on_change_with_' + fieldname,
                    [values], this.get_context(), false);
            } else {
                result = this.model.execute(
                    'on_change_with',
                    [values, fieldnames], this.get_context(), false);
            }
        } catch (e) {
            return;
        }
        this.set_on_change(result);
    }
    for (fieldname in later) {
        on_change_with = this.model.fields[fieldname]
            .description.on_change_with;
        values = this._get_on_change_args(on_change_with);
        try {
            result = this.model.execute(
                'on_change_with_' + fieldname,
                [values], this.get_context(), false);
        } catch (e) {
            return;
        }
        this.model.fields[fieldname].set_on_change(this, result);
    }
};



// END model.js


// screen.js

Sao.Screen.prototype.init = function (model_name, attributes) {
    this.model_name = model_name;
    this.model = new Sao.Model(model_name, attributes);
    this.attributes = jQuery.extend({}, attributes);
    this.view_ids = jQuery.extend([], attributes.view_ids);
    this.view_to_load = jQuery.extend([],
        attributes.mode || ['tree', 'form']);
    this.views = [];
    this.views_preload = attributes.views_preload || {};
    this.exclude_field = attributes.exclude_field;
    this.new_group(attributes.context || {});
    this.current_view = null;
    this.current_record = null;
    this.domain = attributes.domain || [];
    this.context_domain = attributes.context_domain;
    this.size_limit = null;
    //kalenis
    this.field_name = attributes.field_name;
    this.field_type = attributes.field_type;
    this.field_instance = attributes.field_instance;
    //disable view manager for this screen
    this.disable_view_manager = attributes.disable_view_manager || false;

    if ((this.attributes.limit === undefined) ||
        (this.attributes.limit === null)) {
        this.limit = Sao.config.limit;
    } else {
        this.limit = attributes.limit;
    }
    this.offset = 0;
    this.order = this.default_order = attributes.order;
    var access = Sao.common.MODELACCESS.get(model_name);

    if (!(access.write || access.create)) {
        this.attributes.readonly = true;
    }
    this.search_count = 0;
    this.screen_container = new Sao.ScreenContainer(
        attributes.tab_domain);

    this.context_screen = null;
    if (attributes.context_model) {
        this.context_screen = new Sao.Screen(
            attributes.context_model, {
            'mode': ['form'],
            'context': attributes.context
        });

        this.context_screen_prm = this.context_screen.switch_view()
            .then(function () {
                jQuery('<div/>', {
                    'class': 'row'
                }).append(jQuery('<div/>', {
                    'class': 'col-md-12'
                }).append(this.context_screen.screen_container.el))
                    .prependTo(this.screen_container.filter_box);
                return this.context_screen.new_(false).then(function (record) {
                    // Set manually default to get context_screen_prm
                    // resolved when default is set.
                    return record.default_get();
                });
            }.bind(this));
    }

    if (!attributes.row_activate) {
        this.row_activate = this.default_row_activate;
    } else {
        this.row_activate = attributes.row_activate;
    }
    this.tree_states = {};
    this.tree_states_done = [];
    this.fields_view_tree = {};
    this._domain_parser = {};
    this.pre_validate = false;
    this.tab = null;
    this.message_callback = null;
    this.switch_callback = null;
    this.group_changed_callback = null;
    // count_tab_domain is called in Sao.Tab.Form.init after
    // switch_view to avoid unnecessary call to fields_view_get by
    // domain_parser.
};

Sao.Screen.prototype.switch_view = function (view_type, view_id) {
    if ((view_id !== undefined) && (view_id !== null)) {
        view_id = Number(view_id);
    } else {
        view_id = null;
    }
    if (this.current_view) {
        //kalenis: Delete all react component instances when switch views


        switch (this.current_view.view_type) {
            case 'tree': {
                if (this.current_view.view_context === 'list_view' || this.current_view.view_context === "o2m") {
                    // var deleted = Sao.KalenisAddons.Components.delete(this.current_view.el[0]);
                    this._recoverScroll = true;


                }
                break;

            }
            case 'form': {

                var react_fields = jQuery(this.current_view.el[0]).find('[id*="_addon"]');
                // var react_fields = this.current_view.el[0].find('[id*="_addon"]');
                react_fields.each(function (i, element) {

                    var deleted = Sao.KalenisAddons.Components.delete(element);

                });
                break;
            }
        }



        this.current_view.set_value();
        if (this.current_record &&
            !~this.current_record.group.indexOf(
                this.current_record)) {
            this.current_record = null;
        }
        var fields = this.current_view.get_fields();
        if (this.current_record && this.current_view.editable &&
            !this.current_record.validate(
                fields, false, false, true)) {
            this.screen_container.set(this.current_view.el);
            return this.current_view.display().done(function () {
                this.set_cursor();
            }.bind(this));
        }
    }
    var found = function () {
        if (!this.current_view) {
            return false;
        }
        else if (!view_type && (view_id === null)) {
            return false;
        }
        else if (view_id !== null) {
            return this.current_view.view_id == view_id;
        } else {
            return this.current_view.view_type == view_type;
        }
    }.bind(this);
    var _switch = function () {
        var set_container = function () {
            this.screen_container.set(this.current_view.el);
            return this.display().done(function () {
                this.set_cursor();
                if (this.switch_callback) {
                    this.switch_callback();
                }
            }.bind(this));
        }.bind(this);
        var continue_loop = function () {
            if (!view_type && (view_id === null)) {
                return false;
            }
            if (view_type && !view_id && !this.view_to_load.length) {
                return false;
            }
            return true;
        }.bind(this);
        var set_current_view = function () {
            this.current_view = this.views[this.views.length - 1];
        }.bind(this);
        var switch_current_view = (function () {
            set_current_view();
            if (continue_loop()) {
                return _switch();
            } else {
                return set_container();
            }
        }.bind(this));
        var is_view_id = function (view) {
            return view.view_id == view_id;
        };

        while (!found()) {

            if (this.view_to_load.length) {
                return this.load_next_view().then(switch_current_view);
            } else if ((view_id !== null) &&
                !this.views.find(is_view_id)) {
                return this.add_view_id(view_id, view_type)
                    .then(set_current_view);
            } else {

                var i = this.views.indexOf(this.current_view);
                this.current_view = this.views[
                    (i + 1) % this.views.length];
            }
            if (!continue_loop()) {
                break;
            }
        }
        return set_container();
    }.bind(this);
    return _switch();
};


Sao.ScreenContainer.prototype.init = function (tab_domain) {
    this.alternate_viewport = jQuery('<div/>', {
        'class': 'screen-container'
    });
    this.alternate_view = false;
    this.search_modal = null;
    this.search_form = null;
    this.last_search_text = '';
    this.tab_domain = tab_domain || [];
    //kalenis: Active tab is used from TabDomain component (get/set)
    this.active_tab = null;
    this.tabs_counters = {};
    //
    this.tab_counter = [];
    this.el = jQuery('<div/>', {
        'class': 'screen-container'
    });
    this.filter_box = jQuery('<form/>', {
        'class': 'filter-box'
    }).submit(function (e) {
        this.do_search();
        e.preventDefault();
    }.bind(this));
    var search_row = jQuery('<div/>', {
        'class': 'row'
    }).appendTo(this.filter_box);
    this.el.append(this.filter_box);
    this.filter_button = jQuery('<button/>', {
        type: 'button',
        'class': 'btn btn-default'
    }).append(Sao.i18n.gettext('Filters'));
    this.filter_button.click(this.search_box.bind(this));
    this.search_entry = jQuery('<input/>', {
        'class': 'form-control mousetrap',
        'placeholder': Sao.i18n.gettext('Search'),
        // workaround for
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1474137
        'autocomplete': 'off',
    });
    this.search_list = jQuery('<datalist/>');
    this.search_list.uniqueId();
    this.search_entry.attr('list', this.search_list.attr('id'));
    this.search_entry.on('input', this.update.bind(this));

    var but_clear = jQuery('<button/>', {
        'type': 'button',
        'class': 'btn btn-default hidden-md hidden-lg',
        'aria-label': Sao.i18n.gettext("Clear Search"),
        'title': Sao.i18n.gettext("Clear Search"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-clear'));
    but_clear.hide();
    but_clear.click(function () {
        this.search_entry.val('').change();
        this.do_search();
    }.bind(this));

    this.search_entry.on('keyup change', function () {
        if (this.search_entry.val()) {
            but_clear.show();
        } else {
            but_clear.hide();
        }
        this.bookmark_match();
    }.bind(this));

    var but_submit = jQuery('<button/>', {
        'type': 'submit',
        'class': 'btn btn-default',
        'aria-label': Sao.i18n.gettext("Search"),
        'title': Sao.i18n.gettext("Search"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-search'));

    this.but_active = jQuery('<button/>', {
        type: 'button',
        'class': 'btn btn-default hidden-xs',
        'aria-expanded': false,
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-archive', {
        'aria-hidden': true,
    }));
    this._set_active_tooltip();
    this.but_active.click(this.search_active.bind(this));

    this.but_bookmark = jQuery('<button/>', {
        type: 'button',
        'class': 'btn btn-default dropdown-toggle',
        'data-toggle': 'dropdown',
        'aria-expanded': false,
        'aria-label': Sao.i18n.gettext("Bookmarks"),
        'title': Sao.i18n.gettext("Bookmarks"),
        'id': 'bookmarks'
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-bookmark', {
        'aria-hidden': true,
    }));
    var dropdown_bookmark = jQuery('<ul/>', {
        'class': 'dropdown-menu dropdown-menu-right',
        'role': 'menu',
        'aria-labelledby': 'bookmarks'
    });
    this.but_bookmark.click(function () {
        dropdown_bookmark.children().remove();
        var bookmarks = this.bookmarks();
        for (var i = 0; i < bookmarks.length; i++) {
            var name = bookmarks[i][1];
            var domain = bookmarks[i][2];
            jQuery('<li/>', {
                'role': 'presentation'
            })
                .append(jQuery('<a/>', {
                    'role': 'menuitem',
                    'href': '#',
                    'tabindex': -1
                }).append(name)
                    .click(domain, this.bookmark_activate.bind(this)))
                .appendTo(dropdown_bookmark);
        }
    }.bind(this));
    this.but_star = jQuery('<button/>', {
        'class': 'btn btn-default hidden-xs',
        'type': 'button'
    }).append(jQuery('<img/>', {
        'class': 'icon',
        'aria-hidden': true
    }).data('star', false)).click(this.star_click.bind(this));
    this.set_star();

    jQuery('<div/>', {
        'class': 'input-group input-group-sm'
    })
        .append(jQuery('<span/>', {
            'class': 'input-group-btn'
        }).append(this.filter_button))
        .append(this.search_entry)
        .append(this.search_list)
        .append(jQuery('<span/>', {
            'class': 'input-group-btn'
        }).append(but_clear)
            .append(but_submit)
            .append(this.but_star)
            .append(this.but_bookmark)
            .append(dropdown_bookmark)
            .append(this.but_active))
        .appendTo(jQuery('<div/>', {
            'class': 'col-sm-11 col-xs-12'
        }).appendTo(search_row));


    this.but_prev = jQuery('<button/>', {
        type: 'button',
        'class': 'btn btn-default btn-sm',
        'aria-label': Sao.i18n.gettext("Previous"),
        'title': Sao.i18n.gettext("Previous"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-back', {
        'aria-hidden': true,
    }));
    this.but_prev.click(this.search_prev.bind(this));
    this.but_next = jQuery('<button/>', {
        type: 'button',
        'class': 'btn btn-default btn-sm',
        'aria-label': Sao.i18n.gettext("Next"),
        'title': Sao.i18n.gettext("Next"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-forward', {
        'aria-hidden': true,
    }));
    this.but_next.click(this.search_next.bind(this));

    jQuery('<div/>', {
        'class': 'btn-group',
        role: 'group',
    })
        .append(this.but_prev)
        .append(this.but_next)
        .appendTo(jQuery('<div/>', {
            'class': 'col-sm-1 pull-right',
            'style': 'padding-right:0px;'
        }).appendTo(search_row));

    this.content_box = jQuery('<div/>', {
        'class': 'content-box'
    });

    if (!jQuery.isEmptyObject(this.tab_domain)) {
        this.active_tab = 0;
    }
    this.set_active_tab = function (index) {

        this.active_tab = index;
        this.do_search();
    }.bind(this);


    this.el.append(this.content_box);
};

Sao.ScreenContainer.prototype.get_tab_domain = function () {


    if (this.active_tab === null) {

        return [];
    }
    var i = this.active_tab;
    return this.tab_domain[i][1];
};

Sao.ScreenContainer.prototype.set_tab_counter = function (count, idx) {

    if (idx < 0) {
        return;
    }

    this.tabs_counters[idx] = count;

};

// Sao.Screen.prototype.count_tab_domain= function() {
//     var screen_domain = this.search_domain(
//         this.screen_container.get_text());
//     this.screen_container.tab_domain.forEach(function(tab_domain, i) {
//         if (tab_domain[2]) {
//             var domain = ['AND', tab_domain[1], screen_domain];
//             this.screen_container.set_tab_counter(null, i);
//             var count = this.group.model.execute('search_count', [domain], this.context);

//             this.screen_container.set_tab_counter(count, i);

//         }
//     }.bind(this));
// };

Sao.Screen.prototype.search_filter = function (search_string, only_ids) {
    only_ids = only_ids || false;
    if (this.context_screen && !only_ids) {
        if (this.context_screen_prm.state() == 'pending') {
            return this.context_screen_prm.then(function () {
                return this.search_filter(search_string);
            }.bind(this));
        }
        var context_record = this.context_screen.current_record;
        if (context_record &&
            !context_record.validate(null, false, null, true)) {
            this.new_group();
            this.context_screen.display(true);
            return jQuery.when();
        }
        var screen_context = this.context_screen.get_on_change_value();
        delete screen_context.id;
        this.new_group(jQuery.extend(
            this.local_context, screen_context));
    }

    var domain = this.search_domain(search_string, true);
    if (this.context_domain) {
        var decoder = new Sao.PYSON.Decoder(this.context);
        domain = ['AND', domain, decoder.decode(this.context_domain)];
    }
    var tab_domain = this.screen_container.get_tab_domain();
    if (!jQuery.isEmptyObject(tab_domain)) {
        domain = ['AND', domain, tab_domain];
    }
    var context = this.context;
    if (this.screen_container.but_active.hasClass('active')) {
        context.active_test = false;
    }
    var search = function () {
        return this.model.execute(
            'search', [domain, this.offset, this.limit, this.order],
            context)
            .then(function (ids) {
                if (ids.length || this.offset <= 0) {
                    return ids;
                } else {
                    this.offset = Math.max(this.offset - this.limit, 0);
                    return search();
                }
            }.bind(this));
    }.bind(this);
    return search().then(function (ids) {
        var count_prm = jQuery.when(this.search_count);
        if (!only_ids) {
            if ((this.limit !== null) &&
                (ids.length == this.limit)) {
                count_prm = this.model.execute(
                    'search_count', [domain], context)
                    .then(function (count) {
                        this.search_count = count;
                        return this.search_count;
                    }.bind(this), function () {
                        this.search_count = 0;
                        return this.search_count;
                    }.bind(this));
            } else {
                this.search_count = ids.length;
            }
        }
        return count_prm.then(function (count) {
            this.screen_container.but_next.prop('disabled',
                !(this.limit !== undefined &&
                    ids.length == this.limit &&
                    count > this.limit + this.offset));
            this.screen_container.but_prev.prop('disabled', this.offset <= 0);
            if (only_ids) {
                return ids;
            }
            this.clear();
            return this.load(ids).then(function () {
                // this.count_tab_domain();
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

Sao.Screen.prototype.remove = function (delete_, remove, force_remove, records) {
    var prm = jQuery.when();
    records = records || this.current_view.selected_records;
    if (jQuery.isEmptyObject(records)) {
        return prm;
    }
    if (delete_) {
        // TODO delete children before parent
        prm = this.group.delete_(records);
    }
    var top_record = records[0];
    var top_group = top_record.group;
    var idx = top_group.indexOf(top_record);
    var path = top_record.get_path(this.group);
    return prm.then(function () {
        // Kalenis: Prevent group update until last record. 
        //         Avoid multiple renders & requests
        this.group.no_update = true;
        records.forEach(function (record, index) {
            if (index === records.length - 1) {
                this.group.no_update = false;
            }
            record.group.remove(record, remove, true, force_remove);
        }.bind(this));


        var prms = [];
        if (delete_) {
            records.forEach(function (record) {
                if (record.group.parent) {
                    prms.push(record.group.parent.save(false));
                }
                if (~record.group.record_deleted.indexOf(record)) {
                    record.group.record_deleted.splice(
                        record.group.record_deleted.indexOf(record), 1);
                }
                if (~record.group.record_removed.indexOf(record)) {
                    record.group.record_removed.splice(
                        record.group.record_removed.indexOf(record), 1);
                }
                // TODO destroy
            });
        }
        if (idx > 0) {
            var record = top_group[idx - 1];
            path.splice(-1, 1, [path[path.length - 1][0], record.id]);
        } else {
            path.splice(-1, 1);
        }
        if (!jQuery.isEmptyObject(path)) {
            prms.push(this.group.get_by_path(path).then(function (record) {
                this.current_record = record;
            }.bind(this)));
        } else if (this.group.length) {
            this.current_record = this.group[0];

        }

        return jQuery.when.apply(jQuery, prms).then(function () {
            return this.display().done(function () {
                this.set_cursor();
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

//END screen.js


//window.js

Sao.Window.Preferences = Sao.class_(Object, {
    init: function (callback) {
        this.callback = callback;
        var dialog = new Sao.Dialog('Preferences', '', 'lg');
        this.el = dialog.modal;

        jQuery('<button/>', {
            'class': 'btn btn-link',
            'type': 'button'
        }).append(Sao.i18n.gettext('Cancel')).click(function () {
            this.response('RESPONSE_CANCEL');
        }.bind(this)).appendTo(dialog.footer);
        jQuery('<button/>', {
            'class': 'btn btn-primary',
            'type': 'submit'
        }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
        dialog.content.submit(function (e) {
            this.response('RESPONSE_OK');
            e.preventDefault();
        }.bind(this));

        this.screen = new Sao.Screen('res.user', {
            mode: []
        });
        // Reset readonly set automaticly by MODELACCESS
        this.screen.attributes.readonly = false;
        this.screen.group.readonly = false;
        this.screen.group.skip_model_access = true;

        var set_view = function (view) {
            this.screen.add_view(view);
            this.screen.switch_view().done(function () {
                this.screen.new_(false);


                this.screen.model.execute('get_preferences', [false], {})
                    .then(set_preferences.bind(this), this.destroy);
            }.bind(this));
        };

        //KALENIS:Modified, Pending make a diff with dev branch
        var set_preferences = function (preferences) {

            var prm;
            this.screen.current_record.cancel();
            this.screen.current_record.set(preferences);
            this.screen.current_record.id =
                this.screen.model.session.user_id;

            // prm.then(function() {

            this.screen.current_record.validate(null, true).then(
                function () {

                    this.screen.display(true);
                }.bind(this));
            // }.bind(this));
            dialog.body.append(this.screen.screen_container.el);

            this.el.modal('show');
        };
        this.el.on('hidden.bs.modal', function (event) {
            jQuery(this).remove();
        });

        this.screen.model.execute('get_preferences_fields_view', [], {})
            .then(set_view.bind(this), this.destroy);
    },
    response: function (response_id) {
        var end = function () {
            this.destroy();
            this.callback();
        }.bind(this);
        var prm = jQuery.when();
        if (response_id == 'RESPONSE_OK') {
            prm = this.screen.current_record.validate()
                .then(function (validate) {
                    if (validate) {
                        var values = jQuery.extend({}, this.screen.get());
                        return this.screen.model.execute(
                            'set_preferences', [values], {});
                    }
                }.bind(this));
        }
        prm.done(end);
    },
    destroy: function () {
        this.el.modal('hide');
    }
});

Sao.Window.Search.prototype.response = function (response_id) {
    var records;
    var value = [];
    if (response_id == 'RESPONSE_OK') {
        records = this.screen.current_view.selected_records;

    } else if (response_id == 'RESPONSE_APPLY') {
        this.screen.search_filter();
        return;
    } else if (response_id == 'RESPONSE_ACCEPT') {
        var view_ids = jQuery.extend([], this.view_ids);
        if (!jQuery.isEmptyObject(view_ids)) {
            // Remove the first tree view as mode is form only
            view_ids.shift();
        }
        var screen = new Sao.Screen(this.model_name, {
            domain: this.domain,
            context: this.context,
            order: this.order,
            mode: ['form'],
            view_ids: view_ids,
            views_preload: this.views_preload,
        });

        var callback = function (result) {
            if (result) {
                var record = screen.current_record;
                this.callback([[record.id,
                record._values.rec_name || '']]);
            } else {
                this.callback(null);
            }
        };
        this.el.modal('hide');
        new Sao.Window.Form(screen, callback.bind(this), {
            new_: true,
            save_current: true,
            title: this.title
        });
        return;
    }
    if (records) {
        var index, record;
        for (index in records) {
            record = records[index];
            value.push([record.id, record._values.rec_name || '']);
        }
    }
    this.callback(value);

    var react_nodes = this.el.find('[id$="_addon"]');

    if (react_nodes[0]) {
        Sao.KalenisAddons.Components.delete(react_nodes[0]);
    }



    this.el.modal('hide');



};

Sao.Window.Note.prototype.init = function (record, callback) {
    this.resource = record.model.name + ',' + record.id;
    this.note_callback = callback;
    var context = jQuery.extend({}, record.get_context());
    var screen = new Sao.Screen('ir.note', {
        domain: [['resource', '=', this.resource]],
        mode: ['tree', 'form'],
        context: context,
        //KALENIS: disable view manager on Notes screen
        disable_view_manager: true
    });
    var title = record.rec_name().then(function (rec_name) {
        return Sao.i18n.gettext('Notes (%1)', rec_name);
    });

    Sao.Window.Note._super.init.call(this, screen, this.callback,
        { view_type: 'tree', title: title });


    this.switch_prm = this.switch_prm.then(function () {
        return screen.search_filter();
    });
};

Sao.Window.Attachment.prototype.init = function (record, callback) {
    this.resource = record.model.name + ',' + record.id;
    this.attachment_callback = callback;
    var context = jQuery.extend({}, record.get_context());
    var screen = new Sao.Screen('ir.attachment', {
        domain: [['resource', '=', this.resource]],
        mode: ['tree', 'form'],
        context: context,
        //KALENIS: disable view manager on Attachments screen
        disable_view_manager: true
    });
    var title = record.rec_name().then(function (rec_name) {
        return Sao.i18n.gettext('Attachments (%1)', rec_name);
    });
    Sao.Window.Attachment._super.init.call(this, screen, this.callback,
        { view_type: 'tree', title: title });
    this.switch_prm = this.switch_prm.then(function () {
        return screen.search_filter();
    });
};


// End window.js 
///TinyMCE attachments integration Methods

Sao.Window.Attachment.get_attachments_uri = function (record) {
    var prm;
    if (record && (record.id >= 0)) {
        var context = record.get_context();
        prm = Sao.rpc({
            'method': 'model.ir.attachment.search_read',
            'params': [
                [['resource', '=', record.model.name + ',' + record.id]],
                0, 20, null, ['rec_name', 'name', 'type', 'link'],
                context],
        }, record.model.session);
    } else {
        prm = jQuery.when([]);
    }

    return prm.then(function (attachments) {
        return attachments.map(function (attachment) {
            var name = attachment.rec_name;
            if (attachment.type == 'link') {
                return [name, attachment.link];
            }

            else {

                return [name, attachment];



            }
        });
    });
};
Sao.Window.Attachment.open_data_uri = function (attachment, context, session) {
    return Sao.rpc({
        'method': 'model.ir.attachment.read',
        'params': [
            [attachment.id], ['data'], context],
    }, session).then(function (values) {

        var blob = new Blob([values[0].data]);

        return blob;
        // return window.URL.createObjectURL(blob);
        // return values;
    });
};



// End window .js

//Graph.js

Sao.View.Graph.Line.prototype._c3_config = function (data) {
    var config =
        Sao.View.Graph.Line._super._c3_config.call(this,
            data);
    var i, len, yfield;
    config.data.axes = {};
    for (i = 0, len = this.yfields.length; i < len; i++) {
        yfield = this.yfields[i];
        if (yfield.axis) {
            config.data.axes[yfield.name] = 'y2';
            config.axis.y2 = { show: true };
        }
    }

    return config;
};

Sao.View.Graph.Chart.prototype.update_data = function (group) {
    var data = {};
    var record, yfield, key;
    var i, len, j, y_len;

    this.ids = {};
    data.columns = [['labels']];
    data.names = {};
    var key2columns = {};
    var fields2load = [this.xfield.name];
    for (i = 0, len = this.yfields.length; i < len; i++) {
        yfield = this.yfields[i];
        data.columns.push([yfield.name]);
        data.names[yfield.name] = yfield.string;
        key2columns[yfield.key || yfield.name] = i + 1;
        fields2load.push(yfield.name);
    }

    var prms = [];
    var set_data = function (index) {
        return function () {
            record = group[index];
            //Kalenis => RETURN IF NO RECORD, cause of bug in "form-board" view.
            if (!record) {
                return;
            }
            var x = record.field_get_client(this.xfield.name);
            // c3 does not support moment
            if (x && (x.isDate || x.isDateTime)) {
                x = x.toDate();
            }
            data.columns[0][index + 1] = x;
            this._add_id(x, record.id);

            var column;
            for (j = 0, y_len = this.yfields.length; j < y_len; j++) {
                yfield = this.yfields[j];
                key = yfield.key || yfield.name;
                column = data.columns[key2columns[key]];
                if (yfield.domain) {
                    var ctx = jQuery.extend({},
                        Sao.session.current_session.context);
                    ctx.context = ctx;
                    ctx._user = Sao.session.current_session.user_id;
                    for (var field in group.model.fields) {
                        ctx[field] = record.field_get(field);
                    }
                    var decoder = new Sao.PYSON.Decoder(ctx);
                    if (!decoder.decode(yfield.domain)) {
                        column[index + 1] = 0;
                        continue;
                    }
                }
                if (yfield.name == '#') {
                    column[index + 1] = 1;
                } else {
                    var value = record.field_get(yfield.name);
                    if (value && value.isTimeDelta) {
                        value = value.asSeconds();
                    }
                    column[index + 1] = value || 0;
                }
            }
        }.bind(this);
    }.bind(this);
    var load_field = function (record) {
        return function (fname) {
            prms.push(record.load(fname));
        };
    };

    var r_prms = [];
    for (i = 0, len = group.length; i < len; i++) {
        record = group[i];
        fields2load.forEach(load_field(group[i]));

        for (j = 0, y_len = data.columns.length; j < y_len; j++) {
            data.columns[j].push(undefined);
        }
        r_prms.push(
            jQuery.when.apply(jQuery, prms).then(set_data(i)));
    }
    return jQuery.when.apply(jQuery, r_prms).then(function () {
        return data;
    });
};


Sao.View.Graph.Pie.prototype._c3_config = function (data) {
    var config = Sao.View.Graph.Pie._super._c3_config.call(this, data);
    var pie_columns = [], pie_names = {};
    var i, len;
    var labels, values;

    for (i = 0, len = data.columns.length; i < len; i++) {
        if (data.columns[i][0] == 'labels') {
            labels = data.columns[i].slice(1);
        } else {
            values = data.columns[i].slice(1);
        }
    }

    // Pie chart do not support axis definition.
    delete config.axis;
    delete config.data.x;
    var format_func;
    var type = this.view.screen.model.fields[this.xfield.name]
        .description.type;
    if ((type == 'date') || (type == 'datetime')) {
        var date_format = Sao.common.date_format(
            this.view.screen.context.date_format);
        var datetime_format = date_format + ' %X';
        if (type == 'datetime') {
            format_func = function (dt) {
                return Sao.common.format_datetime(datetime_format, dt);
            };
        } else {
            format_func = function (dt) {
                return Sao.common.format_date(date_format, dt);
            };
        }
    }
    var label;
    for (i = 0, len = labels.length; i < len; i++) {
        label = labels[i];
        if (format_func) {
            label = format_func(label);
        }
        pie_columns.push([i, values[i]]);
        pie_names[i] = label;
    }

    config.data.columns = pie_columns;
    config.data.names = pie_names;

    //Kalenis: Hide labels if too many.
    if (labels && labels.length > 20) {
        config.legend = { show: false };
    }


    return config;
};



//End graph.js

///view/tree.js

Sao.View.Tree.Row.prototype.select_row = function (event_) {
    if (this.tree.selection_mode == Sao.common.SELECTION_NONE) {
        this.tree.select_changed(this.record);
        //KALENIS
        // set temp_shift to prevent duplicate tab validation 
        // stack is to long to prop event
        if (event_.shiftKey) {
            Sao.temp_shift = true;
        }
        //
        this.switch_row();
    } else {
        var current_record;
        if (event_.shiftKey &&
            this.tree.selection_mode != Sao.common.SELECTION_SINGLE) {
            current_record = this.tree.screen.current_record;
            this.tree.select_records(current_record, this.record);
        } else {
            if (!event_.ctrlKey ||
                this.tree.selection_mode ==
                Sao.common.SELECTION_SINGLE) {
                this.tree.select_records(null, null);
            }
            this.set_selection(!this.is_selected());
        }
        this.selection_changed();
        if (current_record) {
            // Keep original current record with shift select
            this.tree.screen.current_record = current_record;
        }
    }
};

// End /view/tree.js

//Wizard.js


Sao.Wizard.prototype.response = function(definition) {
    this.__waiting_response = false;
    this.screen.current_view.set_value();
    if (definition.validate && !this.screen.current_record.validate(
            null, null, null, true)) {
        this.screen.display(true);
        this.info_bar.message(
            this.screen.invalid_message(), 'danger');
        //kalenis => return false to activate the submit button
        return false;
    }
    this.info_bar.message();
    this.state = definition.state;
    this.process();
};

Sao.Wizard.prototype.end = function() {
    this.session.context.update_selected = true;
    return Sao.rpc({
        'method': 'wizard.' + this.action + '.delete',
        'params': [this.session_id, this.session.context]
    }, this.session).then(function(action) {
        this.destroy(action);
    }.bind(this));
};


Sao.Wizard.Dialog.prototype._get_button = function(definition) {
    var button = Sao.Wizard.Dialog._super._get_button.call(this,
            definition);
    this.footer.append(button.el);
    if (definition['default']) {
        this.content.unbind('submit');
        this.content.submit(function(e) {
            //Kalenis: Disable submit button while processing
            button.el.prop('disabled', true);
            var res = this.response(definition);
            if(res===false){
                button.el.prop('disabled', false);
            }
            
            e.preventDefault();
        }.bind(this));
        button.el.attr('type', 'submit');
    } else {
        button.el.click(function() {
            button.el.prop('disabled', true);
            var res = this.response(definition);
            if(res===false){
                button.el.prop('disabled', false);
            }
            
        }.bind(this));
    }
    return button;
};



Sao.Wizard.Dialog.prototype.show = function() {
    var view = this.screen.current_view;
    var expand;
    if (view.view_type == 'form') {
        expand = false;
        var fields = view.get_fields();
        for (var i = 0; i < fields.length; i++) {
            var name = fields[i];
            var widgets = view.widgets[name];
            
            for (var j = 0; j < widgets.length; j++) {
                var widget = widgets[j];
                
                if (widget.expand || widget.attributes.xexpand) {
                    
                    expand = true;
                    break;
                }
            }
            if (expand) {
                break;
            }
        }
        
        
    } else {
        expand = true;
    }
    if (expand) {
        this.dialog.find('.modal-dialog')
            .removeClass('modal-md modal-sm')
            .addClass('modal-lg');
    } else {
        this.dialog.find('.modal-dialog')
            .removeClass('modal-lg modal-sm')
            .addClass('modal-md');
    }
    this.dialog.modal('show');
};


//End wizard.js

//action.js

Sao.Action.exec_report = function (attributes) {
    if (!attributes.context) {
        attributes.context = {};
    }
    if (!attributes.email) {
        attributes.email = {};
    }
    var data = jQuery.extend({}, attributes.data);
    var context = jQuery.extend({}, Sao.Session.current_session.context);
    jQuery.extend(context, attributes.context);
    context.direct_print = attributes.direct_print;
    context.email_print = attributes.email_print;
    context.email = attributes.email;

    var prm = Sao.rpc({
        'method': 'report.' + attributes.name + '.execute',
        'params': [data.ids || [], data, context]
    }, Sao.Session.current_session);
    prm.done(function (result) {
        var report_type = result[0];
        var data = result[1];
        var print = result[2];
        var name = result[3];
        var file_name = name + '.' + report_type;

        //kalenis: temporary direct print
        if (print) {
            Sao.common.direct_print(data, file_name);

        }
        else {
            Sao.common.download_file(data, file_name);
        }

    });
};

Sao.Action.exec_action = function (action, data, context) {
    if (!context) {
        context = {};
    } else {
        context = jQuery.extend({}, context);
    }
    var session = Sao.Session.current_session;
    if (data === undefined) {
        data = {};
    } else {
        data = jQuery.extend({}, data);
    }

    delete context.active_id;
    delete context.active_ids;
    delete context.active_model;

    function add_name_suffix(name, context) {
        if (!data.model || !data.ids) {
            return jQuery.when(name);
        }
        var max_records = 5;
        var ids = data.ids.slice(0, max_records);
        return Sao.rpc({
            'method': 'model.' + data.model + '.read',
            'params': [ids, ['rec_name'], context]
        }, Sao.Session.current_session).then(function (result) {
            var name_suffix = result.map(function (record) {
                return record.rec_name;
            }).join(Sao.i18n.gettext(', '));

            if (data.ids.length > max_records) {
                name_suffix += Sao.i18n.gettext(',\u2026');
            }
            return Sao.i18n.gettext('%1 (%2)', name, name_suffix);
        });
    }
    data.action_id = action.id;
    var params = {};
    var name_prm;
    switch (action.type) {
        case 'ir.action.act_window':
            params.view_ids = [];
            params.mode = null;
            if (!jQuery.isEmptyObject(action.views)) {
                params.view_ids = [];
                params.mode = [];
                action.views.forEach(function (x) {
                    params.view_ids.push(x[0]);
                    params.mode.push(x[1]);
                });
            } else if (!jQuery.isEmptyObject(action.view_id)) {
                params.view_ids = [action.view_id[0]];
            }

            if (action.pyson_domain === undefined) {
                action.pyson_domain = '[]';
            }
            var ctx = {
                active_model: data.model || null,
                active_id: data.id || null,
                active_ids: data.ids
            };
            ctx = jQuery.extend(ctx, session.context);
            ctx._user = session.user_id;
            var decoder = new Sao.PYSON.Decoder(ctx);
            params.context = jQuery.extend(
                {}, context,
                decoder.decode(action.pyson_context || '{}'));
            ctx = jQuery.extend(ctx, params.context);

            ctx.context = ctx;
            decoder = new Sao.PYSON.Decoder(ctx);
            //Kalenis: add action id to be used in view_manager
            params.action = action.id;
            params.domain = decoder.decode(action.pyson_domain);
            params.order = decoder.decode(action.pyson_order);
            params.search_value = decoder.decode(
                action.pyson_search_value || '[]');
            params.tab_domain = [];
            action.domains.forEach(function (element, index) {
                params.tab_domain.push(
                    [element[0], decoder.decode(element[1]), element[2]]);
            });
            name_prm = jQuery.when(action.name);
            params.model = action.res_model || data.res_model;
            params.res_id = action.res_id || data.res_id;
            params.context_model = action.context_model;
            params.context_domain = action.context_domain;
            if (action.limit !== null) {
                params.limit = action.limit;
            } else {
                params.limit = Sao.config.limit;
            }
            params.icon = action['icon.rec_name'] || '';

            if (action.keyword) {
                name_prm = add_name_suffix(action.name, params.context);
            }
            name_prm.then(function (name) {
                params.name = name;
                Sao.Tab.create(params);
            });
            return;
        case 'ir.action.wizard':
            params.action = action.wiz_name;
            params.data = data;
            params.context = context;
            params.window = action.window;
            name_prm = jQuery.when(action.name);
            if ((action.keyword || 'form_action') === 'form_action') {
                name_prm = add_name_suffix(action.name, context);
            }
            name_prm.done(function (name) {
                params.name = name;
                Sao.Wizard.create(params);
            });
            return;
        case 'ir.action.report':
            params.name = action.report_name;
            params.data = data;
            params.direct_print = action.direct_print;
            params.email_print = action.email_print;
            params.email = action.email;
            params.context = context;
            Sao.Action.exec_report(params);
            return;
        case 'ir.action.url':
            window.open(action.url, '_blank', 'noreferrer,noopener');
            return;
    }
};

//End Action.js

Sao.Window.InfoBar.prototype.message = function(message, type) {

    if (message) {
        this.el.removeClass(
                'alert-success alert-info alert-warning alert-danger');
        this.el.addClass('alert-' + (type || 'info'));
        this.text.text(message);
        this.el.show();
        if (type == 'info') {
            this.el.delay(2000).fadeOut();
        } 
        else if (type == 'warning') {
            this.el.delay(20000).fadeOut();
        }

    } else {
        this.el.hide();
    }
};



