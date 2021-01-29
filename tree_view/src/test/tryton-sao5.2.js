/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
var Sao = {};

(function() {
    'use strict';

    // Browser compatibility: polyfill
    if (!('contains' in String.prototype)) {
        String.prototype.contains = function(str, startIndex) {
            return -1 !== String.prototype.indexOf.call(this, str, startIndex);
        };
    }
    if (!String.prototype.startsWith) {
        Object.defineProperty(String.prototype, 'startsWith', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function(searchString, position) {
                position = position || 0;
                return this.indexOf(searchString, position) === position;
            }
        });
    }
    if (!String.prototype.endsWith) {
        Object.defineProperty(String.prototype, 'endsWith', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function(searchString, position) {
                position = position || this.length;
                position = position - searchString.length;
                var lastIndex = this.lastIndexOf(searchString);
                return lastIndex !== -1 && lastIndex === position;
            }
        });
    }
    if (!Array.prototype.some) {
        Array.prototype.some = function(fun /*, thisp */) {
            if (this === null) {
                throw new TypeError();
            }
            var thisp, i,
                t = Object(this),
                len = t.length >>> 0;
            if (typeof fun !== 'function') {
                throw new TypeError();
            }
            thisp = arguments[1];
            for (i = 0; i < len; i++) {
                if (i in t && fun.call(thisp, t[i], i, t)) {
                    return true;
                }
            }
            return false;
        };
    }

    if (!Array.from) {
        Array.from = function (value) {
            // Implementation is not strictly equivalent but works for most
            // cases
            var result = [];
            value.forEach(function(e) {
                result.push(e);
            });
            return result;
        };
    }

    Sao.setdefault = function(object, key, value) {
        if (!object.hasOwnProperty(key)) {
            object[key] = value;
        }
        return object[key];
    };

    // Ensure RichText doesn't use style with css
    try {
        document.execCommand('styleWithCSS', false, false);
    } catch (e) {
    }
    try {
        document.execCommand('useCSS', false, true);
    } catch (e) {
    }

    // Add .uniqueId to jQuery
    jQuery.fn.extend({
        uniqueId: (function() {
            var uuid = 0;
            return function() {
                return this.each(function() {
                    if (!this.id) {
                        this.id = "ui-id-" + (++uuid);
                    }
                });
            };
        })()
    });

    window.onbeforeunload = function(e) {
        if (Sao.main_menu_screen) {
            Sao.main_menu_screen.save_tree_state(true);
        }
        if (Sao.Tab.tabs.length) {
            var dialog = Sao.i18n.gettext("Are your sure to leave?");
            e.returnValue = dialog;
            return dialog;
        }
    };

    Sao.class_ = function(Parent, props) {
        var ClassConstructor = function() {
            if (!(this instanceof ClassConstructor))
                throw new Error('Constructor function requires new operator');
            this.Class = ClassConstructor;
            if (this.init) {
                this.init.apply(this, arguments);
            }
        };

        // Plug prototype chain
        ClassConstructor.prototype = Object.create(Parent.prototype);
        ClassConstructor._super = Parent.prototype;
        if (props) {
            for (var name in props) {
                Object.defineProperty(ClassConstructor.prototype, name,
                    Object.getOwnPropertyDescriptor(props, name));
            }
        }
        return ClassConstructor;
    };

    Sao.Decimal = Number;

    Sao.Date = function(year, month, day) {
        var date;
        if (month === undefined) {
            date = moment(year);
            year = undefined;
        }
        else {
            date = moment();
        }
        date.year(year);
        date.month(month);
        date.date(day);
        date.set({hour: 0, minute: 0, second: 0, millisecond: 0});
        date.isDate = true;
        date.toString = function() {
            return this.format('YYYY-MM-DD');
        };
        return date;
    };

    // Add 1 day to the limit because setting time make it out of the range
    Sao.Date.min = moment(new Date((-100000000 + 1) * 86400000));
    Sao.Date.min.set({hour: 0, minute: 0, second: 0, millisecond: 0});
    Sao.Date.min.isDate = true;
    Sao.Date.max = moment(new Date(100000000 * 86400000));
    Sao.Date.max.set({hour: 0, minute: 0, second: 0, millisecond: 0});
    Sao.Date.max.isDate = true;

    Sao.DateTime = function(year, month, day, hour, minute, second,
            millisecond, utc) {
        var datetime;
        if (month === undefined) {
            datetime = moment(year);
            year = undefined;
        }
        else {
            if (hour === undefined) {
                hour = 0;
            }
            if (minute === undefined) {
                minute = 0;
            }
            if (second === undefined) {
                second = 0;
            }
            if (millisecond === undefined) {
                millisecond = 0;
            }
            datetime = moment();
        }
        if (utc) {
            datetime.utc();
        }
        datetime.year(year);
        datetime.month(month);
        datetime.date(day);
        if (month !== undefined) {
            datetime.hour(hour);
            datetime.minute(minute);
            datetime.second(second);
            datetime.milliseconds(millisecond);
        }
        datetime.isDateTime = true;
        datetime.toString = function() {
            if (this.milliseconds()) {
                return this.format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            } else {
                return this.format('YYYY-MM-DD HH:mm:ss');
            }
        };
        datetime.local();
        return datetime;
    };

    Sao.DateTime.combine = function(date, time) {
        var datetime = date.clone();
        datetime.set({hour: time.hour(), minute: time.minute(),
            second: time.second(), millisecond: time.millisecond()});
        datetime.isDateTime = true;
        return datetime;
    };

    Sao.DateTime.min = moment(new Date(-100000000 * 86400000)).local();
    Sao.DateTime.min.isDateTime = true;
    Sao.DateTime.max = moment(new Date(100000000 * 86400000)).local();
    Sao.DateTime.max.isDateTime = true;

    Sao.Time = function(hour, minute, second, millisecond) {
        var time = moment({hour: hour, minute: minute, second: second,
           millisecond: millisecond || 0});
        time.isTime = true;
        return time;
    };

    Sao.TimeDelta = function(days, seconds,
            milliseconds, minutes, hours, weeks) {
        var timedelta = moment.duration({
            days: days,
            seconds: seconds,
            milliseconds: milliseconds,
            minutes: minutes,
            hours: hours,
            weeks: weeks
        });
        timedelta.isTimeDelta = true;
        return timedelta;
    };

    Sao.config = {};
    Sao.config.limit = 1000;
    Sao.config.display_size = 20;
    Sao.config.bug_url = 'https://bugs.tryton.org/';
    Sao.config.title = 'Tryton';
    Sao.config.icon_colors = '#3465a4,#555753,#cc0000'.split(',');
    Sao.config.bus_timeout = 10 * 60 * 1000;

    Sao.i18n = i18n();
    Sao.i18n.setlang = function(lang) {
        if (!lang) {
            lang = (navigator.language ||
                 navigator.browserLanguage ||
                 navigator.userLanguage ||
                 'en').replace('-', '_');
        }
        jQuery('html').attr('lang', lang);
        Sao.i18n.setLocale(lang);
        moment.locale(lang.slice(0, 2));
        return jQuery.getJSON('locale/' + lang + '.json').then(function(data) {
            if (!data[''].language) {
                data[''].language = lang;
            }
            if (!data['']['plural-forms']) {
                data['']['plural-forms'] = 'nplurals=2; plural=(n!=1);';
            }
            // gettext.js requires to dump untranslated keys
            for (var key in data) {
                if ('' === key) {
                    continue;
                }
                data[key] = 2 == data[key].length ? data[key][1] : data[key].slice(1);
            }
            Sao.i18n.loadJSON(data);
        }, function() {
            if (~lang.indexOf('_')) {
                return Sao.i18n.setlang(lang.split('_').slice(0, -1).join('_'));
            }
        });
    };
    Sao.i18n.getlang = function() {
        return Sao.i18n.getLocale();
    };
    Sao.i18n.BC47 = function(lang) {
        return lang.replace('_', '-');
    };
    Sao.i18n.set_direction = function(direction) {
        Sao.i18n.rtl = (direction === 'rtl');
        jQuery('html').attr('dir', direction);
        jQuery('.row-offcanvas')
            .removeClass('row-offcanvas-left row-offcanvas-right')
            .addClass(Sao.i18n.rtl ? 'row-offcanvas-right' : 'row-offcanvas-left');
    };
    Sao.i18n.locale = {};

    Sao.get_preferences = function() {
        var session = Sao.Session.current_session;
        return session.reload_context().then(function() {
            return Sao.rpc({
                'method': 'model.res.user.get_preferences',
                'params': [false, {}]
            }, session).then(function(preferences) {
                var deferreds = [];
                deferreds.push(Sao.common.MODELACCESS.load_models());
                deferreds.push(Sao.common.ICONFACTORY.load_icons());
                deferreds.push(Sao.common.MODELHISTORY.load_history());
                deferreds.push(Sao.common.VIEW_SEARCH.load_searches());
                return jQuery.when.apply(jQuery, deferreds).then(function() {
                    (preferences.actions || []).forEach(function(action_id) {
                        Sao.Action.execute(action_id, {}, null, {});
                    });
                    Sao.set_title();
                    Sao.common.ICONFACTORY.get_icon_url('tryton-menu')
                        .then(function(url) {
                            jQuery('.navbar-brand > img').attr('src', url);
                        });
                    var new_lang = preferences.language != Sao.i18n.getLocale();
                    var prm = jQuery.Deferred();
                    Sao.i18n.setlang(preferences.language).always(function() {
                        if (new_lang) {
                            Sao.user_menu(preferences);
                        }
                        prm.resolve(preferences);
                    });
                    Sao.i18n.set_direction(preferences.language_direction);
                    Sao.i18n.locale = preferences.locale;
                    return prm;
                });
            });
        });
    };

    Sao.set_title = function(name) {
        var title = [name, Sao.config.title];
        document.title = title.filter(function(e) {return e;}).join(' - ');
        jQuery('#title').text(Sao.config.title);
    };

    Sao.set_url = function(path, name) {
        var session = Sao.Session.current_session;
        if (session) {
            var url = '#' + session.database;
            if (path) {
                url += '/' + path;
            }
            window.location = url;
        }
        Sao.set_title(name);
    };

    window.onhashchange = function() {
        var session = Sao.Session.current_session;
        if (!session) {
            return;
        }
        var url,
            database = '#' + session.database;
        if (window.location.hash == database) {
            url = '';
        } else if (window.location.hash.startsWith(database + '/')) {
            url = window.location.hash.substr(database.length + 1);
        } else {
            return;
        }
        var tab;
        if (!url) {
            tab = Sao.Tab.tabs.get_current();
            if (tab) {
                Sao.set_url(tab.get_url(), tab.name);
            }
        } else {
            url = decodeURIComponent(url);
            for (var i = 0; i < Sao.Tab.tabs.length; i++) {
                tab = Sao.Tab.tabs[i];
                if (decodeURIComponent(tab.get_url()) == url) {
                    tab.show();
                    return;
                }
            }
            Sao.open_url();
        }
    };

    Sao.open_url = function(url) {
        function loads(value) {
            return Sao.rpc.convertJSONObject(jQuery.parseJSON(value));
        }
        if (url === undefined) {
            url = window.location.hash.substr(1);
        }
        var i = url.indexOf(';');
        var path, params = {};
        if (i >= 0) {
            path = url.substring(0, i);
            url.substring(i + 1).split('&').forEach(function(part) {
                if (part) {
                    var item = part.split('=').map(decodeURIComponent);
                    params[item[0]] = item[1];
                }
            });
        } else {
            path = url;
        }
        path = path.split('/').slice(1);
        var type = path.shift();

        function open_model(path) {
            var attributes = {};
            attributes.model = path.shift();
            if (!attributes.model) {
                return;
            }
            try {
                attributes.view_ids = loads(params.views || '[]');
                attributes.limit = loads(params.limi || 'null');
                attributes.name = loads(params.name || '""');
                attributes.search_value = loads(params.search_value || '[]');
                attributes.domain = loads(params.domain || '[]');
                attributes.context = loads(params.context || '{}');
                attributes.context_model = params.context_model;
                attributes.tab_domain = loads(params.tab_domain || '[]');
            } catch (e) {
                return;
            }
            var res_id = path.shift();
            if (res_id) {
                res_id = Number(res_id);
                if (isNaN(res_id)) {
                    return;
                }
                attributes.res_id = res_id;
                attributes.mode = ['form', 'tree'];
            }
            try {
                Sao.Tab.create(attributes);
            } catch (e) {
                // Prevent crashing the client
                return;
            }
        }
        function open_wizard(path) {
            var attributes = {};
            attributes.name = path[0];
            if (!attributes.name) {
                return;
            }
            try {
                attributes.data = loads(params.data || '{}');
                attributes.direct_print = loads(params.direct_print || 'false');
                attributes.email_print = loads(params.email_print || 'false');
                attributes.email = loads(params.email || 'null');
                attributes.name = loads(params.name || '""');
                attributes.window = loads(params.window || 'false');
                attributes.context = loads(params.context || '{}');
            } catch (e) {
                return;
            }
            try {
                Sao.Wizard.create(attributes);
            } catch (e) {
                // Prevent crashing the client
                return;
            }
        }
        function open_report(path) {
            var attributes = {};
            attributes.name = path[0];
            if (!attributes.name) {
                return;
            }
            try {
                attributes.data = loads(params.data || '{}');
                attributes.direct_print = loads(params.direct_print || 'false');
                attributes.email_print = loads(params.email_print || 'false');
                attributes.email = loads(params.email || 'null');
                attributes.context = loads(params.context || '{}');
            } catch (e) {
                return;
            }
            try {
                Sao.Action.exec_report(attributes);
            } catch (e) {
                // Prevent crashing the client
                return;
            }
        }
        function open_url() {
            var url;
            try {
                url = loads(params.url || 'false');
            } catch (e) {
                return;
            }
            if (url) {
                window.open(url, '_blank');
            }
        }

        switch (type) {
            case 'model':
                open_model(path);
                break;
            case 'wizard':
                open_wizard(path);
                break;
            case 'report':
                open_report(path);
                break;
            case 'url':
                open_url();
                break;
        }
    };

    Sao.login = function() {
        Sao.set_title();
        Sao.i18n.setlang().always(function() {
            Sao.Session.get_credentials()
                .then(function(session) {
                    Sao.Session.current_session = session;
                    return session.reload_context();
                }).then(Sao.get_preferences).then(function(preferences) {
                    Sao.menu(preferences);
                    Sao.user_menu(preferences);
                    Sao.open_url();
                    Sao.Bus.listen();
                });
        });
    };

    Sao.logout = function() {
        var session = Sao.Session.current_session;
        Sao.Tab.tabs.close(true).done(function() {
            jQuery('#user-preferences').children().remove();
            jQuery('#user-logout').children().remove();
            jQuery('#user-favorites').children().remove();
            jQuery('#global-search').children().remove();
            jQuery('#menu').children().remove();
            session.do_logout().always(Sao.login);
            Sao.set_title();
        });
    };

    Sao.preferences = function() {
        Sao.Tab.tabs.close(true).done(function() {
            jQuery('#user-preferences').children().remove();
            jQuery('#user-favorites').children().remove();
            jQuery('#user-logout').children().remove();
            jQuery('#menu').children().remove();
            new Sao.Window.Preferences(function() {
                Sao.get_preferences().then(function(preferences) {
                    Sao.menu(preferences);
                    Sao.user_menu(preferences);
                });
            });
        });
    };
    Sao.favorites_menu = function() {
        jQuery(window).click(function() {
            Sao.favorites_menu_clear();
        });
        if (!jQuery('#user-favorites').children('.dropdown-menu').length) {
            var name = Sao.main_menu_screen.model_name + '.favorite';
            var session = Sao.Session.current_session;
            var args = {
                'method': 'model.' + name + '.get',
            };
            var menu = jQuery('<ul/>', {
                'class': 'dropdown-menu',
                'aria-expanded': 'false',
                'aria-labelledby': 'user-favorites',
            });
            jQuery('#user-favorites').append(menu);
            Sao.rpc(args, session).then(function(fav) {
                fav.forEach(function(menu_item) {
                    var a = jQuery('<a/>', {
                        'href': '#'
                    });
                    var id = menu_item[0];
                    var li = jQuery('<li/>', {
                        'role': 'presentation'
                    });
                    var icon = Sao.common.ICONFACTORY.get_icon_img(
                        menu_item[2], {'class': 'favorite-icon'});
                    a.append(icon);
                    li.append(a);
                    a.append(menu_item[1]);
                    a.click(function(evt) {
                        evt.preventDefault();
                        Sao.favorites_menu_clear();
                        // ids is not defined to prevent to add suffix
                        Sao.Action.exec_keyword('tree_open', {
                            'model': Sao.main_menu_screen.model_name,
                            'id': id,
                        });
                    });
                    menu.append(li);
                });
                menu.append(jQuery('<li/>', {
                        'class': 'divider'
                }));
                jQuery('<li/>', {
                    'role': 'presentation'
                }).append(jQuery('<a/>', {
                        'href': '#'
                    }).click(function(evt) {
                        evt.preventDefault();
                        Sao.favorites_menu_clear();
                        Sao.Tab.create({
                            'model': Sao.main_menu_screen.model_name +
                            '.favorite',
                            'mode': ['tree', 'form'],
                            'name': Sao.i18n.gettext('Favorites')
                        });
                    }).text(Sao.i18n.gettext('Manage...'))).appendTo(
                       menu);
            });
        }
    };
    Sao.favorites_menu_clear = function() {
        jQuery('#user-favorites').children('.dropdown-menu').remove();
    };

    Sao.user_menu = function(preferences) {
        jQuery('#user-preferences').children().remove();
        jQuery('#user-favorites').children().remove();
        jQuery('#user-logout').children().remove();
        jQuery('#user-preferences').append(jQuery('<a/>', {
            'href': '#',
            'title': preferences.status_bar,
        }).click(function(evt) {
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
        })).append(jQuery('<span/>', {
            'class': 'visible-xs',
        }).text(title)));
    };

    Sao.main_menu_row_activate = function() {
        var screen = Sao.main_menu_screen;
        // ids is not defined to prevent to add suffix
        return Sao.Action.exec_keyword('tree_open', {
            'model': screen.model_name,
            'id': screen.get_id(),
        }, null, false);
    };

    Sao.menu = function(preferences) {
        if (!preferences) {
            var session = Sao.Session.current_session;
            Sao.rpc({
                'method': 'model.res.user.get_preferences',
                'params': [false, {}],
            }, session).then(Sao.menu);
            return;
        }
        var decoder = new Sao.PYSON.Decoder();
        var action = decoder.decode(preferences.pyson_menu);
        var view_ids = false;
        if (!jQuery.isEmptyObject(action.views)) {
            view_ids = action.views.map(function(view) {
                return view[0];
            });
        } else if (action.view_id) {
            view_ids = [action.view_id[0]];
        }
        decoder = new Sao.PYSON.Decoder(Sao.Session.current_session.context);
        var action_ctx = decoder.decode(action.pyson_context || '{}');
        var domain = decoder.decode(action.pyson_domain);
        var form = new Sao.Tab.Form(action.res_model, {
            'mode': ['tree'],
            'view_ids': view_ids,
            'domain': domain,
            'context': action_ctx,
            'selection_mode': Sao.common.SELECTION_NONE,
            'limit': null,
            'row_activate': Sao.main_menu_row_activate,
        });
        Sao.main_menu_screen = form.screen;
        Sao.main_menu_screen.switch_callback = null;
        Sao.Tab.tabs.splice(Sao.Tab.tabs.indexOf(form), 1);
        form.view_prm.done(function() {
            var view = form.screen.current_view;
            view.table.removeClass('table table-bordered table-striped');
            view.table.addClass('no-responsive');
            view.table.find('thead').hide();
            var gs = new Sao.GlobalSearch();
            jQuery('#global-search').children().remove();
            jQuery('#global-search').append(gs.el);
            jQuery('#menu').children().remove();
            jQuery('#menu').append(
                form.screen.screen_container.content_box.detach());
            var column = new FavoriteColumn(form.screen.model.fields.favorite);
            form.screen.views[0].table.find('> colgroup').append(column.col);
            form.screen.views[0].table.find('> thead > tr').append(column.header);
            form.screen.views[0].columns.push(column);
        });
    };
    Sao.main_menu_screen = null;

    var FavoriteColumn = Sao.class_(Object, {
        init: function(favorite) {
            this.field = favorite;
            this.col = jQuery('<col/>', {
                'class': 'favorite',
            });
            this.header = jQuery('<th/>');
            this.footers = [];
            this.attributes = jQuery.extend({}, this.field.description);
            this.attributes.name = this.field.name;

        },
        get_cell: function() {
            var cell = jQuery('<img/>', {
                'class': 'column-affix',
                'tabindex': 0,
            });
            return cell;
        },
        render: function(record, cell) {
            if (!cell) {
                cell = this.get_cell();
            }
            record.load(this.field.name).done(function() {
                if (record._values.favorite !== null) {
                    var icon = 'tryton-star';
                    if (!record._values.favorite) {
                        icon += '-border';
                    }
                    cell.data('star', Boolean(record._values.favorite));
                    Sao.common.ICONFACTORY.get_icon_url(icon)
                        .then(function(url) {
                            cell.attr('src', url);
                        });
                    cell.click({'record': record, 'button': cell},
                        this.favorite_click);
                    }
                }.bind(this));
            return cell;
        },
        favorite_click: function(e) {
            // Prevent activate the action of the row
            e.stopImmediatePropagation();
            var button = e.data.button;
            var method, icon;
            var star = button.data('star');
            if (!star) {
                icon = 'tryton-star';
                method = 'set';
            } else {
                icon = 'tryton-star-border';
                method = 'unset';
            }
            button.data('star', !star);
            Sao.common.ICONFACTORY.get_icon_url(icon)
                .then(function(url) {
                    button.attr('src', url);
                });
            var name = Sao.main_menu_screen.model_name + '.favorite';
            var session = Sao.Session.current_session;
            var args = {
                'method': 'model.' + name + '.' + method,
                'params': [e.data.record.id, session.context]
            };
            Sao.rpc(args, session);
            Sao.favorites_menu_clear();
        }
    });

    Sao.Dialog = Sao.class_(Object, {
        init: function(title, class_, size, keyboard) {
            size = size || 'sm';
            if (keyboard === undefined) {
                keyboard = true;
            }
            this.modal = jQuery('<div/>', {
                'class': class_ + ' modal fade',
                'role': 'dialog',
                'data-backdrop': 'static',
                'data-keyboard': keyboard,
            });
            this.content = jQuery('<form/>', {
                'class': 'modal-content'
            }).appendTo(jQuery('<div/>', {
                'class': 'modal-dialog modal-' + size
            }).appendTo(this.modal));
            this.header = jQuery('<div/>', {
                'class': 'modal-header'
            }).appendTo(this.content);
            if (title) {
                this.add_title(title);
            }
            this.body = jQuery('<div/>', {
                'class': 'modal-body'
            }).appendTo(this.content);
            this.footer = jQuery('<div/>', {
                'class': 'modal-footer'
            }).appendTo(this.content);

            this.modal.on('shown.bs.modal', function() {
                var currently_focused = jQuery(document.activeElement);
                var has_focus = currently_focused.closest(this.el) > 0;
                if (!has_focus) {
                    jQuery(this).find(':input:visible' +
                        ':not([readonly]):not([tabindex^="-"]):first')
                        .focus();
                }
            });
        },
        add_title: function(title) {
            this.header.append(jQuery('<h4/>', {
                'class': 'modal-title'
            }).append(title));
        }
    });

    Sao.GlobalSearch = Sao.class_(Object, {
        init: function() {
            this.el = jQuery('<div/>', {
                'class': 'global-search-container',
            });
            var group = jQuery('<div/>', {
                'class': 'input-group input-group-sm',
            }).appendTo(this.el);

            jQuery('<div/>', {
                'id': 'user-favorites',
                'class': 'input-group-btn',
            }).append(jQuery('<button/>', {
                'class': 'btn btn-default dropdown-toggle',
                'data-toggle': 'dropdown',
                'aria-haspopup': true,
                'aria-expanded': false,
                'title': Sao.i18n.gettext("Favorites"),
                'aria-label': Sao.i18n.gettext("Favorites"),
            }).click(Sao.favorites_menu).append(
                Sao.common.ICONFACTORY.get_icon_img('tryton-bookmarks')))
                .appendTo(group);

            this.search_entry = jQuery('<input>', {
                'id': 'global-search-entry',
                'class': 'form-control mousetrap',
                'placeholder': Sao.i18n.gettext('Action')
            }).appendTo(group);

            var completion = new Sao.common.InputCompletion(
                    this.el,
                    this.update.bind(this),
                    this.match_selected.bind(this),
                    this.format.bind(this));
            completion.input.keydown(function(evt) {
                if (evt.which == Sao.common.RETURN_KEYCODE) {
                    if (!completion.dropdown.hasClass('open')) {
                        evt.preventDefault();
                        completion.menu.dropdown('toggle');
                    }
                }
            });
        },
        format: function(content) {
            var el = jQuery('<div/>');
            Sao.common.ICONFACTORY.get_icon_img(
                content.icon, {'class': 'global_search-icon'})
                .appendTo(el);
            jQuery('<span/>', {
                'class': 'global-search-text'
            }).text(content.record_name).appendTo(el);
            return el;
        },
        update: function(text) {
            var ir_model = new Sao.Model('ir.model');
            return ir_model.execute('global_search',
                    [text, Sao.config.limit, Sao.main_menu_screen.model_name],
                    Sao.main_menu_screen.context)
                .then(function(s_results) {
                var results = [];
                for (var i=0, len=s_results.length; i < len; i++) {
                    results.push({
                        'model': s_results[i][1],
                        'model_name': s_results[i][2],
                        'record_id': s_results[i][3],
                        'record_name': s_results[i][4],
                        'icon': s_results[i][5],
                    });
                }
                return results;
            }.bind(this));
        },
        match_selected: function(item) {
            if (item.model == Sao.main_menu_screen.model_name) {
                // ids is not defined to prevent to add suffix
                Sao.Action.exec_keyword('tree_open', {
                    'model': item.model,
                    'id': item.record_id,
                });
            } else {
                var params = {
                    'model': item.model,
                    'res_id': item.record_id,
                    'mode': ['form', 'tree'],
                    'name': item.model_name
                };
                Sao.Tab.create(params);
            }
            this.search_entry.val('');
        }
    });

    function shortcuts_defs() {
        // Shortcuts available on Tab on this format:
        // {shortcut, label, id of tab button or callback method}
        return [
            {
                shortcut: 'alt+n',
                label: Sao.i18n.gettext('New'),
                id: 'new_',
            }, {
                shortcut: 'ctrl+s',
                label: Sao.i18n.gettext('Save'),
                id: 'save',
            }, {
                shortcut: 'ctrl+l',
                label: Sao.i18n.gettext('Switch'),
                id: 'switch_',
            }, {
                shortcut: 'ctrl+r',
                label: Sao.i18n.gettext('Reload/Undo'),
                id: 'reload',
            }, {
                shortcut: 'ctrl+shift+d',
                label: Sao.i18n.gettext('Duplicate'),
                id: 'copy',
            }, {
                shortcut: 'ctrl+d',
                label: Sao.i18n.gettext('Delete'),
                id: 'delete_',
            }, {
                shortcut: 'ctrl+up',
                label: Sao.i18n.gettext('Previous'),
                id: 'previous',
            }, {
                shortcut: 'ctrl+down',
                label: Sao.i18n.gettext('Next'),
                id: 'next',
            }, {
                shortcut: 'ctrl+f',
                label: Sao.i18n.gettext('Search'),
                id: 'search',
            }, {
                shortcut: 'alt+w',
                label: Sao.i18n.gettext('Close Tab'),
                id: 'close',
            }, {
                shortcut: 'ctrl+shift+t',
                label: Sao.i18n.gettext('Attachment'),
                id: 'attach',
            }, {
                shortcut: 'ctrl+shift+o',
                label: Sao.i18n.gettext('Note'),
                id: 'note',
            }, {
                shortcut: 'ctrl+e',
                label: Sao.i18n.gettext('Action'),
                id: 'action',
            }, {
                shortcut: 'ctrl+shift+r',
                label: Sao.i18n.gettext('Relate'),
                id: 'relate',
            }, {
                shortcut: 'ctrl+p',
                label: Sao.i18n.gettext('Print'),
                id: 'print',
            }, {
                shortcut: 'alt+shift+tab',
                label: Sao.i18n.gettext('Previous tab'),
                callback: function() {
                    Sao.Tab.previous_tab();
                },
            }, {
                shortcut: 'alt+tab',
                label: Sao.i18n.gettext('Next tab'),
                callback: function() {
                    Sao.Tab.next_tab();
                },
            }, {
                shortcut: 'ctrl+k',
                label: Sao.i18n.gettext('Global search'),
                callback: function() {
                    jQuery('#main_navbar:hidden').collapse('show');
                    jQuery('#global-search-entry').focus();
                },
            }, {
                shortcut: 'f1',
                label: Sao.i18n.gettext('Show this help'),
                callback: function() {
                    shortcuts_dialog();
                },
            },
        ];
    }

    jQuery(document).ready(function() {
        set_shortcuts();
        try {
            Notification.requestPermission();
        } catch (e) {
            (console.error || console.log).call(console, e, e.stack);
        }
        Sao.login();
    });

    function set_shortcuts() {
        if (typeof Mousetrap != 'undefined') {
            shortcuts_defs().forEach(function(definition) {
                Mousetrap.bind(definition.shortcut, function() {
                    if (definition.id){
                        var current_tab = Sao.Tab.tabs.get_current();
                        if (current_tab) {
                            var focused = $(':focus');
                            focused.blur();
                            current_tab.el.find('a[id="' + definition.id + '"]').click();
                            focused.focus();
                        }
                    } else if (definition.callback) {
                        jQuery.when().then(definition.callback);
                    }
                    return false;
                });
            });
        }
    }

    function shortcuts_dialog() {
        var dialog = new Sao.Dialog(Sao.i18n.gettext('Keyboard shortcuts'),
            'shortcut-dialog', 'm');
        jQuery('<button>', {
            'class': 'close',
            'data-dismiss': 'modal',
            'aria-label': Sao.i18n.gettext("Close"),
        }).append(jQuery('<span>', {
            'aria-hidden': true,
        }).append('&times;')).prependTo(dialog.header);
        var row = jQuery('<div/>', {
            'class': 'row'
        }).appendTo(dialog.body);
        var global_shortcuts_dl = jQuery('<dl/>', {
            'class': 'dl-horizontal col-md-6'
        }).append(jQuery('<h5/>')
                  .append(Sao.i18n.gettext('Global shortcuts')))
            .appendTo(row);
        var tab_shortcuts_dl = jQuery('<dl/>', {
            'class': 'dl-horizontal col-md-6'
        }).append(jQuery('<h5/>')
            .append(Sao.i18n.gettext('Tab shortcuts')))
        .appendTo(row);

        shortcuts_defs().forEach(function(definition) {
            var dt = jQuery('<dt/>').append(definition.label);
            var dd = jQuery('<dd/>').append(jQuery('<kbd>')
                .append(definition.shortcut));
            var dest_dl;
            if (definition.id) {
                dest_dl = tab_shortcuts_dl;
            } else {
                dest_dl = global_shortcuts_dl;
            }
            dt.appendTo(dest_dl);
            dd.appendTo(dest_dl);
        });
        dialog.modal.on('hidden.bs.modal', function() {
            jQuery(this).remove();
        });

        dialog.modal.modal('show');
        return false;
    }

    Sao.Plugins = [];

    // Fix stacked modal
    jQuery(document)
        .on('show.bs.modal', '.modal', function(event) {
            jQuery(this).appendTo(jQuery('body'));
        })
    .on('shown.bs.modal', '.modal.in', function(event) {
        setModalsAndBackdropsOrder();
    })
    .on('hidden.bs.modal', '.modal', function(event) {
        setModalsAndBackdropsOrder();
        if (jQuery('.modal:visible').length) {
            $(document.body).addClass('modal-open');
        }
    });

    function setModalsAndBackdropsOrder() {
        var modalZIndex = 1040;
        jQuery('.modal.in').each(function(index) {
            var $modal = jQuery(this);
            modalZIndex++;
            $modal.css('zIndex', modalZIndex);
            $modal.next('.modal-backdrop.in').addClass('hidden')
            .css('zIndex', modalZIndex - 1);
        });
        jQuery('.modal.in:visible:last').focus()
        .next('.modal-backdrop.in').removeClass('hidden');
    }
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.rpc = function(args, session, async) {
        var dfd = jQuery.Deferred(),
            result;
        if (!session) {
            session = new Sao.Session();
        }
        if (async === undefined) {
            async = true;
        }
        var params = jQuery.extend([], args.params);
        params.push(jQuery.extend({}, session.context, params.pop()));

        if (session.cache && session.cache.cached(args.method)) {
            result = session.cache.get(
                args.method,
                JSON.stringify(Sao.rpc.prepareObject(params)));
            if (result !== undefined) {
                if (async) {
                    return jQuery.when(result);
                } else {
                    return result;
                }
            }
        }

        var timeoutID = Sao.common.processing.show();

        var ajax_success = function(data, status_, query) {
            if (data === null) {
                Sao.common.warning.run('',
                        Sao.i18n.gettext('Unable to reach the server'));
                dfd.reject();
            } else if (data.error) {
                var name, msg, description;
                if (data.error[0] == 'UserWarning') {
                    name = data.error[1][0];
                    msg = data.error[1][1];
                    description = data.error[1][2];
                    Sao.common.userwarning.run(msg, description)
                        .then(function(result) {
                            if (!~['always', 'ok'].indexOf(result)) {
                                dfd.reject();
                                return;
                            }
                            Sao.rpc({
                                'method': 'model.res.user.warning.create',
                                'params': [[{
                                    'user': session.user_id,
                                    'name': name,
                                    'always': result == 'always'
                                }], {}]
                            }, session).done(function() {
                                Sao.rpc(args, session).then(
                                    dfd.resolve, dfd.reject);
                            });
                        }, dfd.reject);
                    return;
                } else if (data.error[0] == 'UserError') {
                    msg = data.error[1][0];
                    description = data.error[1][1];
                    Sao.common.warning.run(description, msg)
                        .always(dfd.reject);
                    return;
                } else if (data.error[0] == 'ConcurrencyException') {
                    if (args.method.startsWith('model.') &&
                            (args.method.endsWith('.write') ||
                             args.method.endsWith('.delete'))) {
                        var model = args.method.split('.').slice(1, -1).join('.');
                        Sao.common.concurrency.run(model, args.params[0][0],
                                args.params.slice(-1)[0])
                            .then(function() {
                                delete args.params.slice(-1)[0]._timestamp;
                                Sao.rpc(args, session).then(
                                    dfd.resolve, dfd.reject);
                            }, dfd.reject);
                        return;
                    } else {
                        Sao.common.message.run('Concurrency Exception',
                                'tryton-warning').always(dfd.reject);
                        return;
                    }
                } else {
                    Sao.common.error.run(data.error[0], data.error[1]);
                }
                dfd.reject();
            } else {
                result = data.result;
                if (session.cache) {
                    var cache = query.getResponseHeader('X-Tryton-Cache');
                    if (cache) {
                        cache = parseInt(cache, 10);
                        session.cache.set(
                            args.method,
                            JSON.stringify(Sao.rpc.prepareObject(params)),
                            cache,
                            result);
                    }
                }
                dfd.resolve(result);
            }
        };

        var ajax_error = function(query, status_, error) {
            if (query.status == 401) {
                //Try to relog
                Sao.Session.renew(session).then(function() {
                    Sao.rpc(args, session).then(dfd.resolve, dfd.reject);
                }, dfd.reject);
                return;
            } else {
                Sao.common.error.run(status_, error);
                dfd.reject();
            }
        };

        jQuery.ajax({
            'async': async,
            'headers': {
                'Authorization': 'Session ' + session.get_auth()
            },
            'contentType': 'application/json',
            'data': JSON.stringify(Sao.rpc.prepareObject({
                'id': Sao.rpc.id++,
                'method': args.method,
                'params': params
            })),
            'dataType': 'json',
            'url': '/' + (session.database || '') + '/',
            'type': 'post',
            'complete': [function() {
                Sao.common.processing.hide(timeoutID);
            }],
            'success': ajax_success,
            'error': ajax_error,
        });
        if (async) {
            return dfd.promise();
        } else {
            return result;
        }
    };

    Sao.rpc.id = 0;

    Sao.rpc.convertJSONObject = function(value, index, parent) {
       if (value instanceof Array) {
           for (var i = 0, length = value.length; i < length; i++) {
               Sao.rpc.convertJSONObject(value[i], i, value);
           }
       } else if ((typeof(value) != 'string') &&
           (typeof(value) != 'number') && (value !== null)) {
           if (value && value.__class__) {
               switch (value.__class__) {
                   case 'datetime':
                       value = Sao.DateTime(value.year,
                               value.month - 1, value.day, value.hour,
                               value.minute, value.second,
                               value.microsecond / 1000, true);
                       break;
                   case 'date':
                       value = Sao.Date(value.year,
                           value.month - 1, value.day);
                       break;
                   case 'time':
                       value = Sao.Time(value.hour, value.minute,
                               value.second, value.microsecond / 1000);
                       break;
                    case 'timedelta':
                       value = Sao.TimeDelta(null, value.seconds);
                       break;
                   case 'bytes':
                       // javascript's atob does not understand linefeed
                       // characters
                       var byte_string = atob(value.base64.replace(/\s/g, ''));
                       // javascript decodes base64 string as a "DOMString", we
                       // need to convert it to an array of bytes
                       var array_buffer = new ArrayBuffer(byte_string.length);
                       var uint_array = new Uint8Array(array_buffer);
                       for (var j=0; j < byte_string.length; j++) {
                           uint_array[j] = byte_string.charCodeAt(j);
                       }
                       value = uint_array;
                       break;
                   case 'Decimal':
                       value = new Sao.Decimal(value.decimal);
                       break;
               }
               if (parent) {
                   parent[index] = value;
               }
           } else {
               for (var p in value) {
                   Sao.rpc.convertJSONObject(value[p], p, value);
               }
           }
       }
       return parent || value;
    };

    Sao.rpc.prepareObject = function(value, index, parent) {
        if (value instanceof Array) {
            value = jQuery.extend([], value);
            for (var i = 0, length = value.length; i < length; i++) {
                Sao.rpc.prepareObject(value[i], i, value);
            }
        } else if ((typeof(value) != 'string') &&
                (typeof(value) != 'number') &&
                (typeof(value) != 'boolean') &&
                (value !== null) &&
                (value !== undefined)) {
            if (value.isDate){
                value = {
                    '__class__': 'date',
                    'year': value.year(),
                    'month': value.month() + 1,
                    'day': value.date()
                };
            } else if (value.isDateTime) {
                value = value.clone();
                value = {
                    '__class__': 'datetime',
                    'year': value.utc().year(),
                    'month': value.utc().month() + 1,
                    'day': value.utc().date(),
                    'hour': value.utc().hour(),
                    'minute': value.utc().minute(),
                    'second': value.utc().second(),
                    'microsecond': value.utc().millisecond() * 1000
                };
            } else if (value.isTime) {
                value = {
                    '__class__': 'time',
                    'hour': value.hour(),
                    'minute': value.minute(),
                    'second': value.second(),
                    'microsecond': value.millisecond() * 1000
                };
            } else if (value.isTimeDelta) {
                value = {
                    '__class__': 'timedelta',
                    'seconds': value.asSeconds()
                };
            } else if (value instanceof Sao.Decimal) {
                value = {
                    '__class__': 'Decimal',
                    'decimal': value.toString()
                };
            } else if (value instanceof Uint8Array) {
                var strings = [], chunksize = 0xffff;
                // JavaScript Core has hard-coded argument limit of 65536
                // String.fromCharCode can not be called with too many
                // arguments
                for (var j = 0; j * chunksize < value.length; j++) {
                    strings.push(String.fromCharCode.apply(
                                null, value.subarray(
                                    j * chunksize, (j + 1) * chunksize)));
                }
                value = {
                    '__class__': 'bytes',
                    'base64': btoa(strings.join(''))
                };
            } else {
                value = jQuery.extend({}, value);
                for (var p in value) {
                    Sao.rpc.prepareObject(value[p], p, value);
                }
            }
        }
        if (parent) {
            parent[index] = value;
        }
        return parent || value;
    };

    jQuery.ajaxSetup({
        converters: {
           'text json': function(json) {
               return Sao.rpc.convertJSONObject(jQuery.parseJSON(json));
           }
        }
    });
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.PYSON = {};
    Sao.PYSON.eval = {};
    Sao.PYSON.toString = function(value) {
        if (value instanceof Sao.PYSON.PYSON) {
            return value.toString();
        } else if (value instanceof Array) {
            return '[' + value.map(Sao.PYSON.toString).join(', ') + ']';
        } else if (value instanceof Object) {
            return '{' + Object.keys(value).map(function(key) {
                return Sao.PYSON.toString(key) + ': ' +
                    Sao.PYSON.toString(value[key]);
            }).join(', ') + '}';
        } else {
            return JSON.stringify(value);
        }
    };

    Sao.PYSON.PYSON = Sao.class_(Object, {
        init: function() {
        },
        pyson: function() {
            throw 'NotImplementedError';
        },
        types: function() {
            throw 'NotImplementedError';
        },
        toString: function() {
            var klass = this.pyson().__class__;
            var args = this.__string_params__().map(Sao.PYSON.toString);
            return klass + '(' + args.join(', ') + ')';
        },
        __string_params__: function() {
            throw 'NotImplementedError';
        }
    });

    Sao.PYSON.PYSON.eval_ = function(value, context) {
        throw 'NotImplementedError';
    };
    Sao.PYSON.PYSON.init_from_object = function(object) {
        throw 'NotImplementedError';
    };

    Sao.PYSON.Encoder = Sao.class_(Object, {
        prepare: function(value, index, parent) {
            if (value !== null && value !== undefined) {
                if (value instanceof Array) {
                    value = jQuery.extend([], value);
                    for (var i = 0, length = value.length; i < length; i++) {
                        this.prepare(value[i], i, value);
                    }
                } else if (value._isAMomentObject) {
                    if (value.isDate) {
                        value = new Sao.PYSON.Date(
                            value.year(),
                            value.month() + 1,
                            value.date()).pyson();
                    } else {
                        value = new Sao.PYSON.DateTime(
                            value.year(),
                            value.month() + 1,
                            value.date(),
                            value.hours(),
                            value.minutes(),
                            value.seconds(),
                            value.milliseconds() * 1000).pyson();
                    }
                }
            }
            if (parent) {
                parent[index] = value;
            }
            return parent || value;
        },

        encode: function(pyson) {
            pyson = this.prepare(pyson);
            return JSON.stringify(pyson, function(k, v) {
                if (v instanceof Sao.PYSON.PYSON) {
                    return v.pyson();
                } else if (v === null || v === undefined) {
                    return null;
                }
                return v;
            });
        }
    });

    Sao.PYSON.Decoder = Sao.class_(Object, {
        init: function(context, noeval) {
            this.__context = context || {};
            this.noeval = noeval || false;
        },
        decode: function(str) {
            var reviver = function(k, v) {
                if (typeof v == 'object' && v !== null) {
                    var cls = Sao.PYSON[v.__class__];
                    if (cls) {
                        if (!this.noeval) {
                            return cls.eval_(v, this.__context);
                        } else {
                            var args = jQuery.extend({}, v);
                            delete args.__class__;
                            return Sao.PYSON[v.__class__].init_from_object(
                                args);
                        }
                    }
                }
                return v;
            };
            return JSON.parse(str, reviver.bind(this));
        }
    });

    Sao.PYSON.eval.Eval = function(value, default_) {
        return new Sao.PYSON.Eval(value, default_);
    };
    Sao.PYSON.Eval = Sao.class_(Sao.PYSON.PYSON, {
        init: function(value, default_) {
            if (default_ === undefined) {
                default_ = '';
            }
            Sao.PYSON.Eval._super.init.call(this);
            this._value = value;
            this._default = default_;
        },
        pyson: function() {
            return {
                '__class__': 'Eval',
                'v': this._value,
                'd': this._default
            };
        },
        types: function() {
            if (this._default instanceof Sao.PYSON.PYSON) {
                return this._default.types();
            } else {
                return [typeof this._default];
            }
        },
        __string_params__: function() {
            return [this._value, this._default];
        }
    });

    Sao.PYSON.Eval.eval_ = function(value, context) {
        if (value.v in context) {
            return context[value.v];
        } else {
            return value.d;
        }
    };
    Sao.PYSON.Eval.init_from_object = function(obj) {
        return new Sao.PYSON.Eval(obj.v, obj.d);
    };

    Sao.PYSON.eval.Not = function(value) {
        return new Sao.PYSON.Not(value);
    };
    Sao.PYSON.Not = Sao.class_(Sao.PYSON.PYSON, {
        init: function(value) {
            Sao.PYSON.Not._super.init.call(this);
            if (value instanceof Sao.PYSON.PYSON) {
                if (jQuery(value.types()).not(['boolean', 'object']).length ||
                    jQuery(['boolean']).not(value.types()).length) {
                    value = new Sao.PYSON.Bool(value);
                    }
            } else if (typeof value != 'boolean') {
                value = Sao.PYSON.Bool(value);
            }
            this._value = value;
        },
        pyson: function() {
            return {
                '__class__': 'Not',
                'v': this._value
                };
        },
        types: function() {
            return ['boolean'];
        },
        __string_params__: function() {
            return [this._value];
        }
    });

    Sao.PYSON.Not.eval_ = function(value, context) {
        return !value.v;
    };
    Sao.PYSON.Not.init_from_object = function(obj) {
        return new Sao.PYSON.Not(obj.v);
    };

    Sao.PYSON.eval.Bool = function(value) {
        return new Sao.PYSON.Bool(value);
    };
    Sao.PYSON.Bool = Sao.class_(Sao.PYSON.PYSON, {
        init: function(value) {
            Sao.PYSON.Bool._super.init.call(this);
            this._value = value;
        },
        pyson: function() {
            return {
                '__class__': 'Bool',
                'v': this._value
                };
        },
        types: function() {
            return ['boolean'];
        },
        __string_params__: function() {
            return [this._value];
        }
    });

    Sao.PYSON.Bool.eval_ = function(value, context) {
        if (moment.isMoment(value.v) && value.v.isTime) {
            return Boolean(value.v.hour() || value.v.minute() ||
                    value.v.second() || value.v.millisecond());
        } else if (moment.isDuration(value.v)) {
            return Boolean(value.v.valueOf());
        } else if (value.v instanceof Number) {
            return Boolean(value.v.valueOf());
        } else if (value.v instanceof Object) {
            return !jQuery.isEmptyObject(value.v);
        } else {
            return Boolean(value.v);
        }
    };
    Sao.PYSON.Bool.init_from_object = function(obj) {
        return new Sao.PYSON.Bool(obj.v);
    };


    Sao.PYSON.eval.And = function(statements) {
        return new Sao.PYSON.And(statements);
    };
    Sao.PYSON.And = Sao.class_(Sao.PYSON.PYSON, {
        init: function(statements) {
            if (statements === undefined) {
                statements = [];
            }
            Sao.PYSON.And._super.init.call(this);
            for (var i = 0, len = statements.length; i < len; i++) {
                var statement = statements[i];
                if (statement instanceof Sao.PYSON.PYSON) {
                    if (jQuery(statement.types()).not(['boolean']).length ||
                        jQuery(['boolean']).not(statement.types()).length) {
                        statements[i] = new Sao.PYSON.Bool(statement);
                        }
                } else if (typeof statement != 'boolean') {
                    statements[i] = new Sao.PYSON.Bool(statement);
                }
            }
            if (statements.length < 2) {
                throw 'must have at least 2 statements';
            }
            this._statements = statements;
        },
        pyson: function() {
            return {
                '__class__': 'And',
                's': this._statements
            };
        },
        types: function() {
            return ['boolean'];
        },
        __string_params__: function() {
            return this._statements;
        }
    });

    Sao.PYSON.And.eval_ = function(value, context) {
        var result = true;
        for (var i = 0, len = value.s.length; i < len; i++) {
            var statement = value.s[i];
            result = result && statement;
        }
        return result;
    };
    Sao.PYSON.And.init_from_object = function(obj) {
        return new Sao.PYSON.And(obj.s);
    };


    Sao.PYSON.eval.Or = function(statements) {
        return new Sao.PYSON.Or(statements);
    };
    Sao.PYSON.Or = Sao.class_(Sao.PYSON.And, {
        pyson: function() {
            var result = Sao.PYSON.Or._super.pyson.call(this);
            result.__class__ = 'Or';
            return result;
        }
    });

    Sao.PYSON.Or.eval_ = function(value, context) {
        var result = false;
        for (var i = 0, len = value.s.length; i < len; i++) {
            var statement = value.s[i];
            result = result || statement;
        }
        return result;
    };
    Sao.PYSON.Or.init_from_object= function(obj) {
        return new Sao.PYSON.Or(obj.s);
    };

    Sao.PYSON.eval.Equal = function(statement1, statement2) {
        return new Sao.PYSON.Equal(statement1, statement2);
    };
    Sao.PYSON.Equal = Sao.class_(Sao.PYSON.PYSON, {
        init: function(statement1, statement2) {
            Sao.PYSON.Equal._super.init.call(this);
            var types1, types2;
            if (statement1 instanceof Sao.PYSON.PYSON) {
                types1 = statement1.types();
            } else {
                types1 = [typeof statement1];
            }
            if (statement2 instanceof Sao.PYSON.PYSON) {
                types2 = statement2.types();
            } else {
                types2 = [typeof statement2];
            }
            if (jQuery(types1).not(types2).length ||
                jQuery(types2).not(types1).length) {
                throw 'statements must have the same type';
                }
            this._statement1 = statement1;
            this._statement2 = statement2;
        },
        pyson: function() {
            return {
                '__class__': 'Equal',
                's1': this._statement1,
                's2': this._statement2
            };
        },
        types: function() {
            return ['boolean'];
        },
        __string_params__: function() {
            return [this._statement1, this._statement2];
        }
    });

    Sao.PYSON.Equal.eval_ = function(value, context) {
        if (value.s1 instanceof Array  && value.s2 instanceof Array) {
            return Sao.common.compare(value.s1, value.s2);
        } else if (moment.isMoment(value.s1) && moment.isMoment(value.s2)) {
            return ((value.s1.isDate == value.s2.isDate) &&
                (value.s1.isDateTime == value.s2.isDateTime) &&
                (value.s1.valueOf() == value.s2.valueOf()));
        } else {
            return value.s1 == value.s2;
        }
    };
    Sao.PYSON.Equal.init_from_object = function(obj) {
        return new Sao.PYSON.Equal(obj.s1, obj.s2);
    };

    Sao.PYSON.eval.Greater = function(statement1, statement2, equal) {
        return new Sao.PYSON.Greater(statement1, statement2, equal);
    };
    Sao.PYSON.Greater = Sao.class_(Sao.PYSON.PYSON, {
        init: function(statement1, statement2, equal) {
            Sao.PYSON.Greater._super.init.call(this);
            var statements = [statement1, statement2];
            for (var i = 0; i < 2; i++) {
                var statement = statements[i];
                if (statement instanceof Sao.PYSON.PYSON) {
                    if (jQuery(statement).not(['number']).length) {
                        throw 'statement must be an integer or a float';
                    }
                } else {
                    if (!~['number', 'object'].indexOf(typeof statement)) {
                        throw 'statement must be an integer or a float';
                    }
                }
            }
            if (equal === undefined) {
                equal = false;
            }
            if (equal instanceof Sao.PYSON.PYSON) {
                if (jQuery(equal.types()).not(['boolean']).length ||
                    jQuery(['boolean']).not(equal.types()).length) {
                    equal = new Sao.PYSON.Bool(equal);
                    }
            } else if (typeof equal != 'boolean') {
                equal = new Sao.PYSON.Bool(equal);
            }
            this._statement1 = statement1;
            this._statement2 = statement2;
            this._equal = equal;
        },
        pyson: function() {
            return {
                '__class__': 'Greater',
                's1': this._statement1,
                's2': this._statement2,
                'e': this._equal
            };
        },
        types: function() {
            return ['boolean'];
        },
        __string_params__: function() {
            return [this._statement1, this._statement2, this._equal];
        }
    });

    Sao.PYSON.Greater._convert = function(value) {
        value = jQuery.extend({}, value);
        value.s1 = Number(value.s1);
        value.s2 = Number(value.s2);
        return value;
    };

    Sao.PYSON.Greater.eval_ = function(value, context) {
        value = Sao.PYSON.Greater._convert(value);
        if (value.e) {
            return value.s1 >= value.s2;
        } else {
            return value.s1 > value.s2;
        }
    };
    Sao.PYSON.Greater.init_from_object = function(obj) {
        return new Sao.PYSON.Greater(obj.s1, obj.s2, obj.e);
    };

    Sao.PYSON.eval.Less = function(statement1, statement2, equal) {
        return new Sao.PYSON.Less(statement1, statement2, equal);
    };
    Sao.PYSON.Less = Sao.class_(Sao.PYSON.Greater, {
        pyson: function() {
            var result = Sao.PYSON.Less._super.pyson.call(this);
            result.__class__ = 'Less';
            return result;
        }
    });

    Sao.PYSON.Less._convert = Sao.PYSON.Greater._convert;

    Sao.PYSON.Less.eval_ = function(value, context) {
        value = Sao.PYSON.Less._convert(value);
        if (value.e) {
            return value.s1 <= value.s2;
        } else {
            return value.s1 < value.s2;
        }
    };
    Sao.PYSON.Less.init_from_object = function(obj) {
        return new Sao.PYSON.Less(obj.s1, obj.s2, obj.e);
    };

    Sao.PYSON.eval.If = function(condition, then_statement, else_statement) {
        return new Sao.PYSON.If(condition, then_statement, else_statement);
    };
    Sao.PYSON.If = Sao.class_(Sao.PYSON.PYSON, {
        init: function(condition, then_statement, else_statement) {
            Sao.PYSON.If._super.init.call(this);
            if (condition instanceof Sao.PYSON.PYSON) {
                if (jQuery(condition.types()).not(['boolean']).length ||
                    jQuery(['boolean']).not(condition.types()).length) {
                    condition = new Sao.PYSON.Bool(condition);
                }
            } else if (typeof condition != 'boolean') {
                condition = new Sao.PYSON.Bool(condition);
            }
            var then_types, else_types;
            if (then_statement instanceof Sao.PYSON.PYSON) {
                then_types = then_statement.types();
            } else {
                then_types = [typeof then_statement];
            }
            if (else_statement === undefined) {
                else_statement = null;
            }
            if (else_statement instanceof Sao.PYSON.PYSON) {
                else_types = else_statement.types();
            } else {
                else_types = [typeof else_statement];
            }
            if (jQuery(then_types).not(else_types).length ||
                jQuery(else_types).not(then_types).length) {
                throw 'then and else statements must be the same type';
            }
            this._condition = condition;
            this._then_statement = then_statement;
            this._else_statement = else_statement;
        },
        pyson: function() {
            return {
                '__class__': 'If',
                'c': this._condition,
                't': this._then_statement,
                'e': this._else_statement
            };
        },
        types: function() {
            if (this._then_statement instanceof Sao.PYSON.PYSON) {
                return this._then_statement.types();
            } else {
                return [typeof this._then_statement];
            }
        },
        __string_params__: function() {
            return [this._condition, this._then_statement,
                this._else_statement];
        }
    });

    Sao.PYSON.If.eval_ = function(value, context) {
        if (value.c) {
            return value.t;
        } else {
            return value.e;
        }
    };
    Sao.PYSON.If.init_from_object = function(obj) {
        return new Sao.PYSON.If(obj.c, obj.t, obj.e);
    };

    Sao.PYSON.eval.Get = function(obj, key, default_) {
        return new Sao.PYSON.Get(obj, key, default_);
    };
    Sao.PYSON.Get = Sao.class_(Sao.PYSON.PYSON, {
        init: function(obj, key, default_) {
            Sao.PYSON.Get._super.init.call(this);
            if (default_ === undefined) {
                default_ = null;
            }
            if (obj instanceof Sao.PYSON.PYSON) {
                if (jQuery(obj.types()).not(['object']).length ||
                    jQuery(['object']).not(obj.types()).length) {
                    throw 'obj must be a dict';
                }
            } else {
                if (!(obj instanceof Object)) {
                    throw 'obj must be a dict';
                }
            }
            this._obj = obj;
            if (key instanceof Sao.PYSON.PYSON) {
                if (jQuery(key.types()).not(['string']).length ||
                    jQuery(['string']).not(key.types()).length) {
                    throw 'key must be a string';
                }
            } else {
                if (typeof key != 'string') {
                    throw 'key must be a string';
                }
            }
            this._key = key;
            this._default = default_;
        },
        pyson: function() {
            return {
                '__class__': 'Get',
                'v': this._obj,
                'k': this._key,
                'd': this._default
            };
        },
        types: function() {
            if (this._default instanceof Sao.PYSON.PYSON) {
                return this._default.types();
            } else {
                return [typeof this._default];
            }
        },
        __string_params__: function() {
            return [this._obj, this._key, this._default];
        }
    });

    Sao.PYSON.Get.eval_ = function(value, context) {
        if (value.k in value.v) {
            return value.v[value.k];
        } else {
            return value.d;
        }
    };
    Sao.PYSON.Get.init_from_object = function(obj) {
        return new Sao.PYSON.Get(obj.v, obj.k, obj.d);
    };

    Sao.PYSON.eval.In = function(key, obj) {
        return new Sao.PYSON.In(key, obj);
    };
    Sao.PYSON.In = Sao.class_(Sao.PYSON.PYSON, {
        init: function(key, obj) {
            Sao.PYSON.In._super.init.call(this);
            if (key instanceof Sao.PYSON.PYSON) {
                if (jQuery(key.types()).not(['string', 'number']).length) {
                    throw 'key must be a string or a number';
                }
            } else {
                if (!~['string', 'number'].indexOf(typeof key)) {
                    throw 'key must be a string or a number';
                }
            }
            if (obj instanceof Sao.PYSON.PYSON) {
                if (jQuery(obj.types()).not(['object']).length ||
                    jQuery(['object']).not(obj.types()).length) {
                    throw 'obj must be a dict or a list';
                }
            } else {
                if (!(obj instanceof Object)) {
                    throw 'obj must be a dict or a list';
                }
            }
            this._key = key;
            this._obj = obj;
        },
        pyson: function() {
            return {'__class__': 'In',
                'k': this._key,
                'v': this._obj
            };
        },
        types: function() {
            return ['boolean'];
        },
        __string_params__: function() {
            return [this._key, this._obj];
        }
    });

    Sao.PYSON.In.eval_ = function(value, context) {
        if (value.v.indexOf) {
            return Boolean(~value.v.indexOf(value.k));
        } else {
            return !!value.v[value.k];
        }
    };
    Sao.PYSON.In.init_from_object = function(obj) {
        return new Sao.PYSON.In(obj.k, obj.v);
    };

    Sao.PYSON.eval.Date = function(year, month, day, delta_years, delta_months,
            delta_days) {
        return new Sao.PYSON.Date(year, month, day, delta_years, delta_months,
                delta_days);
    };
    Sao.PYSON.Date = Sao.class_(Sao.PYSON.PYSON, {
        init: function(year, month, day, delta_years, delta_months, delta_days)
        {
            Sao.PYSON.Date._super.init.call(this);
            if (year === undefined) year = null;
            if (month === undefined) month = null;
            if (day === undefined) day = null;
            if (delta_years === undefined) delta_years = 0;
            if (delta_months === undefined) delta_months = 0;
            if (delta_days === undefined) delta_days = 0;

            this._test(year, 'year');
            this._test(month, 'month');
            this._test(day, 'day');
            this._test(delta_years, 'delta_years');
            this._test(delta_days, 'delta_days');
            this._test(delta_months, 'delta_months');

            this._year = year;
            this._month = month;
            this._day = day;
            this._delta_years = delta_years;
            this._delta_months = delta_months;
            this._delta_days = delta_days;
        },
        pyson: function() {
            return {
                '__class__': 'Date',
                'y': this._year,
                'M': this._month,
                'd': this._day,
                'dy': this._delta_years,
                'dM': this._delta_months,
                'dd': this._delta_days
            };
        },
        types: function() {
            return ['object'];
        },
        _test: function(value, name) {
            if (value instanceof Sao.PYSON.PYSON) {
                if (jQuery(value.types()).not(
                        ['number', typeof null]).length) {
                    throw name + ' must be an integer or None';
                }
            } else {
                if ((typeof value != 'number') && (value !== null)) {
                    throw name + ' must be an integer or None';
                }
            }
        },
        __string_params__: function() {
            return [this._year, this._month, this._day, this._delta_years,
                this._delta_months, this._delta_days];
        }
    });

    Sao.PYSON.Date.eval_ = function(value, context) {
        var date = Sao.Date(value.y, value.M && value.M - 1, value.d);
        if (value.dy) date.add(value.dy, 'y');
        if (value.dM) date.add(value.dM, 'M');
        if (value.dd) date.add(value.dd, 'd');
        return date;
    };
    Sao.PYSON.Date.init_from_object = function(obj) {
        return new Sao.PYSON.Date(obj.y, obj.M, obj.d, obj.dy, obj.dM, obj.dd);
    };

    Sao.PYSON.eval.DateTime = function(year, month, day, hour, minute, second,
            microsecond, delta_years, delta_months, delta_days, delta_hours,
            delta_minutes, delta_seconds, delta_microseconds) {
        return new Sao.PYSON.DateTime(year, month, day, hour, minute, second,
            microsecond, delta_years, delta_months, delta_days, delta_hours,
            delta_minutes, delta_seconds, delta_microseconds);
    };
    Sao.PYSON.DateTime = Sao.class_(Sao.PYSON.Date, {
        init: function(year, month, day, hour, minute, second, microsecond,
                  delta_years, delta_months, delta_days, delta_hours,
                  delta_minutes, delta_seconds, delta_microseconds) {
            Sao.PYSON.DateTime._super.init.call(this, year, month, day,
                delta_years, delta_months, delta_days);
            if (hour === undefined) hour = null;
            if (minute === undefined) minute = null;
            if (second === undefined) second = null;
            if (microsecond === undefined) microsecond = null;
            if (delta_hours === undefined) delta_hours = 0;
            if (delta_minutes === undefined) delta_minutes = 0;
            if (delta_seconds === undefined) delta_seconds = 0;
            if (delta_microseconds === undefined) delta_microseconds = 0;

            this._test(hour, 'hour');
            this._test(minute, 'minute');
            this._test(second, 'second');
            this._test(microsecond, 'microsecond');
            this._test(delta_hours, 'delta_hours');
            this._test(delta_minutes, 'delta_minutes');
            this._test(delta_seconds, 'delta_seconds');
            this._test(delta_microseconds, 'delta_microseconds');

            this._hour = hour;
            this._minute = minute;
            this._second = second;
            this._microsecond = microsecond;
            this._delta_hours = delta_hours;
            this._delta_minutes = delta_minutes;
            this._delta_seconds = delta_seconds;
            this._delta_microseconds = delta_microseconds;
        },
        pyson: function() {
            var result = Sao.PYSON.DateTime._super.pyson.call(this);
            result.__class__ = 'DateTime';
            result.h = this._hour;
            result.m = this._minute;
            result.s = this._second;
            result.ms = this._microsecond;
            result.dh = this._delta_hours;
            result.dm = this._delta_minutes;
            result.ds = this._delta_seconds;
            result.dms = this._delta_microseconds;
            return result;
        },
        __string_params__: function() {
            var date_params = Sao.PYSON.DateTime._super.__string_params__.call(
                this);
            return [date_params[0], date_params[1], date_params[2],
                this._hour, this._minute, this._second, this._microsecond,
                date_params[3], date_params[4], date_params[5],
                this._delta_hours, this._delta_minutes, this._delta_seconds,
                this._delta_microseconds];
        }
    });

    Sao.PYSON.DateTime.eval_ = function(value, context) {
        var date = Sao.DateTime(value.y, value.M && value.M - 1, value.d,
                value.h, value.m, value.s, value.ms && value.ms / 1000, true);
        if (value.dy) date.add(value.dy, 'y');
        if (value.dM) date.add(value.dM, 'M');
        if (value.dd) date.add(value.dd, 'd');
        if (value.dh) date.add(value.dh, 'h');
        if (value.dm) date.add(value.dm, 'm');
        if (value.ds) date.add(value.ds, 's');
        if (value.dms) date.add(value.dms / 1000, 'ms');
        return date;
    };
    Sao.PYSON.DateTime.init_from_object = function(obj) {
        return new Sao.PYSON.DateTime(obj.y, obj.M, obj.d, obj.h, obj.m, obj.s,
            obj.ms, obj.dy, obj.dM, obj.dd, obj.dh, obj.dm, obj.ds, obj.dms);
    };

    Sao.PYSON.eval.TimeDelta = function(days, seconds, microseconds) {
        return new Sao.PYSON.TimeDelta(days, seconds, microseconds);
    };
    Sao.PYSON.TimeDelta = Sao.class_(Sao.PYSON.PYSON, {
        init: function(days, seconds, microseconds) {
            Sao.PYSON.TimeDelta._super.init.call(this);
            if (days === undefined) days = 0;
            if (seconds === undefined) seconds = 0;
            if (microseconds === undefined) microseconds = 0;

            function test(value, name) {
                if (value instanceof Sao.PYSON.TimeDelta) {
                    if (jQuery(value.types()).not(['number']).length)
                    {
                        throw name + ' must be an integer';
                    }
                } else {
                    if (typeof value != 'number') {
                        throw name + ' must be an integer';
                    }
                }
                return value;
            }
            this._days = test(days, 'days');
            this._seconds = test(seconds, 'seconds');
            this._microseconds = test(microseconds, 'microseconds');
        },
        pyson: function() {
            return {
                '__class__': 'TimeDelta',
                'd': this._days,
                's': this._seconds,
                'm': this._microseconds,
            };
        },
        types: function() {
            return ['object'];
        },
        __string_params__: function() {
            return [this._days, this._seconds, this._microseconds];
        },
    });
    Sao.PYSON.TimeDelta.eval_ = function(value, context) {
        return Sao.TimeDelta(value.d, value.s, value.m / 1000);
    };
    Sao.PYSON.TimeDelta.init_from_object = function(obj) {
        return new Sao.PYSON.TimeDelta(obj.d, obj.s, obj.microseconds);
    };

    Sao.PYSON.eval.Len = function(value) {
        return new Sao.PYSON.Len(value);
    };
    Sao.PYSON.Len = Sao.class_(Sao.PYSON.PYSON, {
        init: function(value) {
            Sao.PYSON.Len._super.init.call(this);
            if (value instanceof Sao.PYSON.PYSON) {
                if (jQuery(value.types()).not(['object', 'string']).length ||
                    jQuery(['object', 'string']).not(value.types()).length) {
                    throw 'value must be an object or a string';
                }
            } else {
                if ((typeof value != 'object') && (typeof value != 'string')) {
                    throw 'value must be an object or a string';
                }
            }
            this._value = value;
        },
        pyson: function() {
            return {
                '__class__': 'Len',
                'v': this._value
            };
        },
        types: function() {
            return ['integer'];
        },
        __string_params__: function() {
            return [this._value];
        }
    });

    Sao.PYSON.Len.eval_ = function(value, context) {
        if (typeof value.v == 'object') {
            return Object.keys(value.v).length;
        } else {
            return value.v.length;
        }
    };
    Sao.PYSON.Len.init_from_object = function(obj) {
        return new Sao.PYSON.Len(obj.v);
    };
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa#Unicode_strings
    function utoa(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }

    Sao.Session = Sao.class_(Object, {
        init: function(database, login) {
            this.user_id = null;
            this.session = null;
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
                    }
                }
            }
            this.context = {
                client: Sao.Bus.id,
            };
            if (!Sao.Session.current_session) {
                Sao.Session.current_session = this;
            }
        },
        get_auth: function() {
            return utoa(this.login + ':' + this.user_id + ':' + this.session);
        },
        do_login: function(login, parameters) {
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
                this.session = result[1];
                this.store();
                dfd.resolve();
            }.bind(this), function() {
                this.user_id = null;
                this.session = null;
                this.store();
                dfd.reject();
            }.bind(this));
            return dfd.promise();
        },
        do_logout: function() {
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
            if (Sao.Session.current_session === this) {
                Sao.Session.current_session = null;
            }
            return prm;
        },
        reload_context: function() {
            var args = {
                'method': 'model.res.user.get_preferences',
                'params': [true, {}]
            };
            this.context = {
                client: Sao.Bus.id,
            };
            var prm = Sao.rpc(args, this);
            return prm.then(function(context) {
                jQuery.extend(this.context, context);
            }.bind(this));
        },
        store: function() {
            var session = {
                'login': this.login,
                'user_id': this.user_id,
                'session': this.session,
            };
            session = JSON.stringify(session);
            localStorage.setItem('sao_session_' + this.database, session);
        },
        unstore: function() {
            localStorage.removeItem('sao_session_' + this.database);
        },
    });

    Sao.Session.login_dialog = function() {
        var dialog = new Sao.Dialog(Sao.i18n.gettext('Login'), 'lg');
        dialog.database_select = jQuery('<select/>', {
            'class': 'form-control',
            'id': 'database'
        }).hide();
        dialog.database_input = jQuery('<input/>', {
            'class': 'form-control',
            'id': 'database'
        }).hide();
        dialog.login_input = jQuery('<input/>', {
            'class': 'form-control',
            'id': 'login',
            'placeholder': Sao.i18n.gettext('User name')
        });
        dialog.body.append(jQuery('<div/>', {
            'class': 'form-group'
        }).append(jQuery('<label/>', {
            'class': 'control-label',
            'for': 'database'
        }).append(Sao.i18n.gettext('Database')))
        .append(dialog.database_select)
        .append(dialog.database_input)
        ).append(jQuery('<div/>', {
            'class': 'form-group'
        }).append(jQuery('<label/>', {
            'class': 'control-label',
            'for': 'login'
        }).append(Sao.i18n.gettext('User name')))
        .append(dialog.login_input)
        );
        dialog.button = jQuery('<button/>', {
            'class': 'btn btn-primary',
            'type': 'submit'
        }).append(' ' + Sao.i18n.gettext("Login")).appendTo(dialog.footer);
        return dialog;
    };

    Sao.Session.get_credentials = function() {
        var database_url = function() {
            return window.location.hash.replace(
                /^(#(!|))/, '').split('/', 1)[0] || null;
        };
        var dfd = jQuery.Deferred();
        var database = database_url();

        var session = new Sao.Session(database, null);
        if (session.session) {
            dfd.resolve(session);
            return dfd;
        }
        var dialog = Sao.Session.login_dialog();

        var empty_field = function() {
            return dialog.modal.find('input,select').filter(':visible:not([readonly])')
                .filter(function() {
                    return !jQuery(this).val();
                });
        };

        var ok_func = function() {
            var login = dialog.login_input.val();
            var database = database || dialog.database_select.val() ||
                dialog.database_input.val();
            dialog.modal.find('.has-error').removeClass('has-error');
            if (!(login && database)) {
                empty_field().closest('.form-group').addClass('has-error');
                return;
            }
            dialog.button.focus();
            dialog.button.prop('disabled', true);
            dialog.modal.modal('hide');
            session.database = database;
            session.do_login(login)
                .then(function() {
                    dfd.resolve(session);
                    dialog.modal.remove();
                    if (database_url() != database) {
                        window.location = '#' + database;
                    }
                }, function() {
                    dialog.button.prop('disabled', false);
                    dialog.modal.modal('show');
                    empty_field().closest('.form-group').addClass('has-error');
                    empty_field().first().focus();
                });
        };

        dialog.modal.modal({
            backdrop: false,
            keyboard: false
        });
        dialog.modal.find('form').unbind().submit(function(e) {
            ok_func();
            e.preventDefault();
        });
        dialog.modal.on('shown.bs.modal', function() {
            empty_field().first().focus();
        });

        jQuery.when(Sao.DB.list()).then(function(databases) {
            var el;
            databases = databases || [];
            if (databases.length == 1 ) {
                database = databases[0];
                el = dialog.database_input;
            } else {
                el = dialog.database_select;
                databases.forEach(function(database) {
                    el.append(jQuery('<option/>', {
                        'value': database,
                        'text': database
                    }));
                });
            }
            el.prop('readonly', databases.length == 1);
            el.show();
            el.val(database || '');
        }, function() {
            dialog.database_input.show();
        });
        return dfd.promise();
    };

    Sao.Session.renew = function(session) {
        if (session.prm.state() == 'pending') {
            return session.prm;
        }
        var dfd = jQuery.Deferred();
        session.prm = dfd.promise();
        session.do_login(session.login).then(dfd.resolve, function() {
            Sao.logout();
            dfd.reject();
        }).done(function () {
            Sao.Bus.listen();
        });
        return session.prm;
    };

    Sao.Session.current_session = null;

    Sao.Login = Sao.class_(Object, {
        init: function(func, session) {
            this.func = func;
            this.session = session || Sao.Session.current_session;
        },
        run: function(parameters) {
            if (parameters === undefined) {
                parameters = {};
            }
            var dfd = jQuery.Deferred();
            var timeoutID = Sao.common.processing.show();
            var data = this.func(parameters);
            data.id = 0;
            var args = {
                'contentType': 'application/json',
                'data': JSON.stringify(data),
                'dataType': 'json',
                'url': '/' + this.session.database + '/',
                'type': 'post',
                'complete': [function() {
                    Sao.common.processing.hide(timeoutID);
                }]
            };
            if (this.session.user_id && this.session.session) {
                args.headers = {
                    'Authorization': 'Session ' + this.session.get_auth()
                };
            }
            var ajax_prm = jQuery.ajax(args);

            var ajax_success = function(data) {
                if (data === null) {
                    Sao.common.warning.run('',
                           Sao.i18n.gettext('Unable to reach the server.'));
                    dfd.reject();
                } else if (data.error) {
                    if (data.error[0].startsWith('401')) {
                        return this.run({}).then(dfd.resolve, dfd.reject);
                    } else if (data.error[0].startsWith('404')) {
                        dfd.reject();
                    } else if (data.error[0] != 'LoginException') {
                        Sao.common.error.run(data.error[0], data.error[1]);
                        dfd.reject();
                    } else {
                        var args = data.error[1];
                        var name = args[0];
                        var message = args[1];
                        var type = args[2];
                        this['get_' + type](message).then(function(value) {
                            parameters[name] = value;
                            return this.run(parameters).then(
                                    dfd.resolve, dfd.reject);
                        }.bind(this), dfd.reject);
                    }
                } else {
                    dfd.resolve(data.result);
                }
            };
            var ajax_error = function(query, status_, error) {
                if (query.status == 401) {
                    // Retry
                    this.run({}).then(dfd.resolve, dfd.reject);
                } else {
                    Sao.common.error.run(status_, error);
                    dfd.reject();
                }
            };
            ajax_prm.done(ajax_success.bind(this));
            ajax_prm.fail(ajax_error.bind(this));
            return dfd.promise();
        },
        get_char: function(message) {
            return Sao.common.ask.run(message);
        },
        get_password: function(message) {
            return Sao.common.ask.run(message, false);
        },
    });

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

    Sao.DB = {};

    Sao.DB.list = function() {
        var timeoutID = Sao.common.processing.show();
        return jQuery.ajax({
            'contentType': 'application/json',
            'data': JSON.stringify({
                'id': 0,
                'method': 'common.db.list',
                'params': []
            }),
            'dataType': 'json',
            'url': '/',
            'type': 'post',
            'complete': [function() {
                Sao.common.processing.hide(timeoutID);
            }]
        }).then(function(data) {
            return data.result;
        });
    };
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Model = Sao.class_(Object, {
        init: function(name, attributes) {
            attributes = attributes || {};
            this.name = name;
            this.session = Sao.Session.current_session;
            this.fields = {};
        },
        add_fields: function(descriptions) {
            var added = [];
            for (var name in descriptions) {
                var desc = descriptions[name];
                if (!(name in this.fields)) {
                    var Field = Sao.field.get(desc.type);
                    this.fields[name] = new Field(desc);
                    added.push(name);
                } else {
                    jQuery.extend(this.fields[name].description, desc);
                }
            }
            return added;
        },
        execute: function(method, params, context, async) {
            if (context === undefined) {
                context = {};
            }
            var args = {
                'method': 'model.' + this.name + '.' + method,
                'params': params.concat(context)
            };
            return Sao.rpc(args, this.session, async);
        },
        copy: function(records, context) {
            if (jQuery.isEmptyObject(records)) {
                return jQuery.when();
            }
            var record_ids = records.map(function(record) {
                return record.id;
            });
            return this.execute('copy', [record_ids, {}], context);
        }
    });

    Sao.Group = function(model, context, array) {
        array.prm = jQuery.when();
        array.model = model;
        array._context = context;
        array.on_write = [];
        array.parent = undefined;
        array.screens = [];
        array.parent_name = '';
        array.children = [];
        array.child_name = '';
        array.parent_datetime_field = undefined;
        array.record_removed = [];
        array.record_deleted = [];
        array.__readonly = false;
        array.exclude_field = null;
        array.skip_model_access = false;
        array.forEach(function(e, i, a) {
            e.group = a;
        });
        Object.defineProperty(array, 'readonly', {
            get: function() {
                // Must skip res.user for Preference windows
                var access = Sao.common.MODELACCESS.get(this.model.name);
                if (this.context._datetime ||
                    (!(access.write || access.create) &&
                        !this.skip_model_access)) {
                    return true;
                }
                return this.__readonly;
            },
            set: function(value) {
                this.__readonly = value;
            }
        });
        array.load = function(ids, modified) {
            var new_records = [];
            var i, len;
            for (i = 0, len = ids.length; i < len; i++) {
                var id = ids[i];
                var new_record = this.get(id);
                if (!new_record) {
                    new_record = new Sao.Record(this.model, id);
                    new_record.group = this;
                    this.push(new_record);
                }
                new_records.push(new_record);
            }
            // Remove previously removed or deleted records
            var record_removed = [];
            var record;
            for (i = 0, len = this.record_removed.length; i < len; i++) {
                record = this.record_removed[i];
                if (!~ids.indexOf(record.id)) {
                    record_removed.push(record);
                }
            }
            this.record_removed = record_removed;
            var record_deleted = [];
            for (i = 0, len = this.record_deleted.length; i < len; i++) {
                record = this.record_deleted[i];
                if (!~ids.indexOf(record.id)) {
                    record_deleted.push(record);
                }
            }
            this.record_deleted = record_deleted;
            if (new_records.length && modified) {
                new_records.forEach(function(record) {
                    record._changed.id = true;
                });
                var root_group = this.root_group;
                this.changed().then(function() {
                    root_group.screens.forEach(function(screen) {
                        screen.display();
                    });
                });
            }
        };
        array.get = function(id) {
            // TODO optimize
            for (var i = 0, len = this.length; i < len; i++) {
                var record = this[i];
                if (record.id == id) {
                    return record;
                }
            }
        };
        array.new_ = function(default_, id, rec_name) {
            var record = new Sao.Record(this.model, id);
            record.group = this;
            if (default_) {
                record.default_get(rec_name);
            }
            return record;
        };
        array.add = function(record, position, changed) {
            if ((position === undefined) || (position == -1)) {
                position = this.length;
            }
            if (changed === undefined) {
                changed = true;
            }
            if (record.group != this) {
                record.group = this;
            }
            this.splice(position, 0, record);
            for (var record_rm in this.record_removed) {
                if (record_rm.id == record.id) {
                    this.record_removed.splice(
                            this.record_removed.indexOf(record_rm), 1);
                }
            }
            for (var record_del in this.record_deleted) {
                if (record_del.id == record.id) {
                    this.record_deleted.splice(
                            this.record_deleted.indexOf(record_del), 1);
                }
            }
            record._changed.id = true;
            if (changed) {
                this.changed();
                // Set parent field to trigger on_change
                if (this.parent && this.model.fields[this.parent_name]) {
                    var field = this.model.fields[this.parent_name];
                    if ((field instanceof Sao.field.Many2One) ||
                            field instanceof Sao.field.Reference) {
                        var value = [this.parent.id, ''];
                        if (field instanceof Sao.field.Reference) {
                            value = [this.parent.model.name, value];
                        }
                        field.set_client(record, value);
                    }
                }
            }
            return record;
        };
        array.remove = function(record, remove, modified, force_remove) {
            if (modified === undefined) {
                modified = true;
            }
            var idx = this.indexOf(record);
            if (record.id >= 0) {
                if (remove) {
                    if (~this.record_deleted.indexOf(record)) {
                        this.record_deleted.splice(
                                this.record_deleted.indexOf(record), 1);
                    }
                    this.record_removed.push(record);
                } else {
                    if (~this.record_removed.indexOf(record)) {
                        this.record_removed.splice(
                                this.record_removed.indexOf(record), 1);
                    }
                    this.record_deleted.push(record);
                }
            }
            if (record.group.parent) {
                record.group.parent._changed.id = true;
            }
            if (modified) {
                record._changed.id = true;
            }
            if ((record.id < 0) || force_remove) {
                this._remove(record);
            }
            record.group.changed();
        };
        array._remove = function(record) {
            var idx = this.indexOf(record);
            this.splice(idx, 1);
        };
        array.unremove = function(record) {
            this.record_removed.splice(this.record_removed.indexOf(record), 1);
            this.record_deleted.splice(this.record_deleted.indexOf(record), 1);
            record.group.changed();
        };
        array.clear = function() {
            this.splice(0, this.length);
            this.record_removed = [];
            this.record_deleted = [];
        };
        array.changed = function() {
            if (!this.parent) {
                return jQuery.when.apply(jQuery,
                    this.screens.map(function(screen) {
                        return screen.display();
                    }));
            }
            this.parent._changed[this.child_name] = true;
            var changed_prm = this.parent.model.fields[this.child_name]
                .changed(this.parent);
            // One2Many.changed could return undefined
            if (!changed_prm) {
                changed_prm = jQuery.when();
            }
            return changed_prm.then(function() {
                this.parent.validate(null, true).done(function() {
                    return this.parent.group.changed();
                }.bind(this));
            }.bind(this));
        };
        array.delete_ = function(records) {
            if (jQuery.isEmptyObject(records)) {
                return jQuery.when();
            }
            var root_group = this.root_group;
            console.assert(records.every(function(r) {
                return r.model.name == this.model.name;
            }.bind(this)), 'records not from the same model');
            console.assert(records.every(function(r) {
                return r.group.root_group == root_group;
            }), 'records not from the same root group');
            records = records.filter(function(record) {
                return record.id >= 0;
            });
            var context = this.context;
            context._timestamp = {};
            records.forEach(function(record) {
                jQuery.extend(context._timestamp, record.get_timestamp());
            });
            var record_ids = records.map(function(record) {
                return record.id;
            });
            return root_group.on_write_ids(record_ids).then(function(reload_ids) {
                reload_ids = reload_ids.filter(function(e) {
                    return !~record_ids.indexOf(e);
                });
                return this.model.execute('delete', [record_ids], context)
                .then(function() {
                    root_group.reload(reload_ids);
                });
            }.bind(this));
        };
        Object.defineProperty(array, 'root_group', {
            get: function() {
                var root = this;
                var parent = this.parent;
                while (parent) {
                    root = parent.group;
                    parent = parent.parent;
                }
                return root;
            }
        });
        array.save = function() {
            var deferreds = [];
            this.forEach(function(record) {
                deferreds.push(record.save());
            });
            if (!jQuery.isEmptyObject(this.record_deleted)) {
                this.record_deleted.forEach(function(record) {
                    this._remove(record);
                }.bind(this));
                deferreds.push(this.delete_(this.record_deleted));
                this.record_deleted.splice(0, this.record_deleted.length);
            }
            return jQuery.when.apply(jQuery, deferreds);
        };
        array.written = function(ids) {
            if (typeof(ids) == 'number') {
                ids = [ids];
            }
            return this.on_write_ids(ids).then(function(to_reload) {
                to_reload = to_reload.filter(function(e) {
                    return !~ids.indexOf(e);
                });
                this.root_group.reload(to_reload);
            }.bind(this));
        };
        array.reload = function(ids) {
            this.children.forEach(function(child) {
                child.reload(ids);
            });
            ids.forEach(function(id) {
                var record = this.get(id);
                if (record && jQuery.isEmptyObject(record._changed)) {
                    record.cancel();
                }
            }.bind(this));
        };
        array.on_write_ids = function(ids) {
            var deferreds = [];
            var result = [];
            this.on_write.forEach(function(fnct) {
                var prm = this.model.execute(fnct, [ids], this._context)
                .then(function(res) {
                    jQuery.extend(result, res);
                });
                deferreds.push(prm);
            }.bind(this));
            return jQuery.when.apply(jQuery, deferreds).then(function() {
                return result.filter(function(e, i, a) {
                    return i == a.indexOf(e);
                });
            });
        };
        array.set_parent = function(parent) {
            this.parent = parent;
            if (parent && parent.model.name == this.model.name) {
                this.parent.group.children.push(this);
            }
        };
        array.add_fields = function(fields) {
            var added = this.model.add_fields(fields);
            if (jQuery.isEmptyObject(this)) {
                return;
            }
            var new_ = [];
            this.forEach(function(record) {
                if (record.id < 0) {
                    new_.push(record);
                }
            });
            if (new_.length && added.length) {
                this.model.execute('default_get', [added, this.context])
                    .then(function(values) {
                        new_.forEach(function(record) {
                            record.set_default(values, true, false);
                        });
                        this.root_group.screens.forEach(function(screen) {
                            return screen.display();
                        });
                    }.bind(this));
            }
        };
        array.destroy = function() {
            if (this.parent) {
                var i = this.parent.group.children.indexOf(this);
                if (~i) {
                    this.parent.group.children.splice(i, 1);
                }
            }
            this.parent = null;
        };
        Object.defineProperty(array, 'domain', {
            get: function() {
                var domain = [];
                this.screens.forEach(function(screen) {
                    if (screen.attributes.domain) {
                        domain.push(screen.attributes.domain);
                    }
                });
                if (this.parent && this.child_name) {
                    var field = this.parent.model.fields[this.child_name];
                    return [domain, field.get_domain(this.parent)];
                } else {
                    return domain;
                }
            }
        });
        Object.defineProperty(array, 'context', {
            get: function() {
                return this._get_context();
            },
            set: function(context) {
                this._context = jQuery.extend({}, context);
            }
        });
        Object.defineProperty(array, 'local_context', {
            get: function() {
                return this._get_context(true);
            }
        });
        array._get_context = function(local) {
            var context;
            if (!local) {
                context = jQuery.extend({}, this.model.session.context);
            } else {
                context = {};
            }
            if (this.parent) {
                var parent_context = this.parent.get_context(local);
                jQuery.extend(context, parent_context);
                if (this.child_name in this.parent.model.fields) {
                    var field = this.parent.model.fields[this.child_name];
                    jQuery.extend(context, field.get_context(
                        this.parent, parent_context, local));
                }
            }
            jQuery.extend(context, this._context);
            if (this.parent_datetime_field) {
                context._datetime = this.parent.get_eval()
                [this.parent_datetime_field];
            }
            return context;
        };
        array.clean4inversion = function(domain) {
            if (jQuery.isEmptyObject(domain)) {
                return [];
            }
            var inversion = new Sao.common.DomainInversion();
            var head = domain[0];
            var tail = domain.slice(1);
            if (~['AND', 'OR'].indexOf(head)) {
            } else if (inversion.is_leaf(head)) {
                var field = head[0];
                if ((field in this.model.fields) &&
                        (this.model.fields[field].description.readonly)) {
                    head = [];
                }
            } else {
                head = this.clean4inversion(head);
            }
            return [head].concat(this.clean4inversion(tail));
        };
        array.domain4inversion = function() {
            var domain = this.domain;
            if (!this.__domain4inversion ||
                    !Sao.common.compare(this.__domain4inversion[0], domain)) {
                this.__domain4inversion = [domain, this.clean4inversion(domain)];
            }
            return this.__domain4inversion[1];
        };
        array.get_by_path = function(path) {
            path = jQuery.extend([], path);
            var record = null;
            var group = this;

            var browse_child = function() {
                if (jQuery.isEmptyObject(path)) {
                    return record;
                }
                var child_name = path[0][0];
                var id = path[0][1];
                path.splice(0, 1);
                record = group.get(id);
                if (!record) {
                    return null;
                }
                if (!child_name) {
                    return browse_child();
                }
                return record.load(child_name).then(function() {
                    group = record._values[child_name];
                    if (!group) {
                        return null;
                    }
                    return browse_child();
                });
            };
            return jQuery.when().then(browse_child);
        };
        return array;
    };

    Sao.Record = Sao.class_(Object, {
        id_counter: -1,
        init: function(model, id) {
            this.model = model;
            this.group = Sao.Group(model, {}, []);
            if ((id === undefined) || (id === null)) {
                this.id = Sao.Record.prototype.id_counter;
            } else {
                this.id = id;
            }
            if (this.id < 0) {
                Sao.Record.prototype.id_counter--;
            }
            this._values = {};
            this._changed = {};
            this._loaded = {};
            this.fields = {};
            this._timestamp = null;
            this.resources = null;
            this.button_clicks = {};
            this.state_attrs = {};
            this.autocompletion = {};
            this.exception = false;
        },
        has_changed: function() {
            return !jQuery.isEmptyObject(this._changed);
        },
        save: function(force_reload) {
            if (force_reload === undefined) {
                force_reload = false;
            }
            var context = this.get_context();
            var prm = jQuery.when();
            if ((this.id < 0) || this.has_changed()) {
                var values = this.get();
                if (this.id < 0) {
                    // synchronous call to avoid multiple creation
                    try {
                        this.id = this.model.execute(
                            'create', [[values]], context,  false)[0];
                    } catch (e) {
                        return jQuery.Deferred().reject();
                    }
                } else {
                    if (!jQuery.isEmptyObject(values)) {
                        context._timestamp = this.get_timestamp();
                        prm = this.model.execute('write', [[this.id], values],
                            context);
                    }
                }
                prm = prm.done(function() {
                    this.cancel();
                    if (force_reload) {
                        return this.reload();
                    }
                }.bind(this));
                if (this.group) {
                    prm = prm.done(function() {
                        return this.group.written(this.id);
                    }.bind(this));
                }
            }
            if (this.group.parent) {
                delete this.group.parent._changed[this.group.child_name];
                prm = prm.done(function() {
                    return this.group.parent.save(force_reload);
                }.bind(this));
            }
            return prm;
        },
        reload: function(fields) {
            if (this.id < 0) {
                return jQuery.when();
            }
            if (!fields) {
                return this.load('*');
            } else {
                var prms = fields.map(function(field) {
                    return this.load(field);
                }.bind(this));
                return jQuery.when.apply(jQuery, prms);
            }
        },
        load: function(name) {
            var fname;
            var prm;
            if ((this.id < 0) || (name in this._loaded)) {
                return jQuery.when();
            }
            if (this.group.prm.state() == 'pending') {
                return this.group.prm.then(function() {
                    return this.load(name);
                }.bind(this));
            }
            var id2record = {};
            id2record[this.id] = this;
            var loading, views, field;
            if (name == '*') {
                loading = 'eager';
                views = new Set();
                var views_add = function(view) {
                    views.add(view);
                };
                for (fname in this.model.fields) {
                    field = this.model.fields[fname];
                    if ((field.description.loading || 'eager') == 'lazy') {
                        loading = 'lazy';
                    }
                    field.views.forEach(views_add);
                }
            } else {
                loading = this.model.fields[name].description.loading || 'eager';
                views = this.model.fields[name].views;
            }
            var fields = {};
            if (loading == 'eager') {
                for (fname in this.model.fields) {
                    field = this.model.fields[fname];
                    if ((field.description.loading || 'eager') == 'eager') {
                        fields[fname] = field;
                    }
                }
            } else {
                fields = this.model.fields;
            }
            var fnames = [];
            for (fname in fields) {
                field = fields[fname];
                if (!(fname in this._loaded) &&
                    (!views.size ||
                        Sao.common.intersect(
                            Array.from(views).sort(),
                            Array.from(field.views).sort()))) {
                    fnames.push(fname);
                }
            }
            var fnames_to_fetch = fnames.slice();
            var rec_named_fields = ['many2one', 'one2one', 'reference'];
            for (var i in fnames) {
                fname = fnames[i];
                var fdescription = this.model.fields[fname].description;
                if (~rec_named_fields.indexOf(fdescription.type))
                    fnames_to_fetch.push(fname + '.rec_name');
            }
            if (!~fnames.indexOf('rec_name')) {
                fnames_to_fetch.push('rec_name');
            }
            fnames_to_fetch.push('_timestamp');

            var context = jQuery.extend({}, this.get_context());
            if (loading == 'eager') {
                var limit = parseInt(Sao.config.limit / fnames_to_fetch.length,
                        10);

                var filter_group = function(record) {
                    return !(name in record._loaded) && (record.id >= 0);
                };
                var filter_parent_group = function(record) {
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
                    var length = group.length;
                    var n = 1;
                    while ((Object.keys(id2record).length < limit) &&
                        ((idx - n >= 0) || (idx + n < length)) &&
                        (n < 2 * limit)) {
                            var record;
                            if (idx - n >= 0) {
                                record = group[idx - n];
                                if (filter(record)) {
                                    id2record[record.id] = record;
                                }
                            }
                            if (idx + n < length) {
                                record = group[idx + n];
                                if (filter(record)) {
                                    id2record[record.id] = record;
                                }
                            }
                            n++;
                        }
                }
            }

            for (fname in this.model.fields) {
                if (!this.model.fields.hasOwnProperty(fname)) {
                    continue;
                }
                if ((this.model.fields[fname].description.type == 'binary') &&
                        ~fnames_to_fetch.indexOf(fname, fnames_to_fetch)) {
                    context[this.model.name + '.' + fname] = 'size';
                }
            }
            prm = this.model.execute('read', [Object.keys(id2record).map(
                        function (e) { return parseInt(e, 10); }),
                    fnames_to_fetch], context);
            var succeed = function(values, exception) {
                if (exception === undefined) exception = false;
                var id2value = {};
                var promises = [];
                values.forEach(function(e, i, a) {
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
            var failed = function() {
                var failed_values = [];
                var default_values;
                for (var id in id2record) {
                    default_values = {
                        id: id
                    };
                    for (var i in fnames_to_fetch) {
                        default_values[fnames_to_fetch[i]] = null;
                    }
                    failed_values.push(default_values);
                }
                return succeed(failed_values, true);
            };
            this.group.prm = prm.then(succeed, failed);
            return this.group.prm;
        },
        set: function(values, validate) {
            if (validate === undefined) {
                validate = true;
            }
            var name, value;
            var promises = [];
            var rec_named_fields = ['many2one', 'one2one', 'reference'];
            var later = {};
            var fieldnames = [];
            for (name in values) {
                if (!values.hasOwnProperty(name)) {
                    continue;
                }
                value = values[name];
                if (name == '_timestamp') {
                    // Always keep the older timestamp
                    if (!this._timestamp) {
                        this._timestamp = value;
                    }
                    continue;
                }
                if (!(name in this.model.fields)) {
                    if (name == 'rec_name') {
                        this._values[name] = value;
                    }
                    continue;
                }
                if (this.model.fields[name] instanceof Sao.field.One2Many) {
                    later[name] = value;
                }
                if ((this.model.fields[name] instanceof Sao.field.Many2One) ||
                        (this.model.fields[name] instanceof Sao.field.Reference)) {
                    var related = name + '.';
                    this._values[related] = values[related] || {};
                }
                promises.push(this.model.fields[name].set(this, value));
                fieldnames.push(name);
            }
            for (name in later) {
                value = later[name];
                promises.push(this.model.fields[name].set(this, value));
            }
            return jQuery.when.apply(jQuery, promises.filter(Boolean))
                .then(function() {
                    for (var i = 0; i < fieldnames.length; i++) {
                        this._loaded[fieldnames[i]] = true;
                    }
                    if (validate) {
                        return this.validate(fieldnames, true);
                    }
                }.bind(this));
        },
        get: function() {
            var value = {};
            for (var name in this.model.fields) {
                if (!this.model.fields.hasOwnProperty(name)) {
                    continue;
                }
                var field = this.model.fields[name];
                if (field.description.readonly &&
                        !((field instanceof Sao.field.One2Many) &&
                            !(field instanceof Sao.field.Many2Many))) {
                    continue;
                }
                if ((this._changed[name] === undefined) && this.id >= 0) {
                    continue;
                }
                value[name] = field.get(this);
                // Sending an empty x2MField breaks ModelFieldAccess.check
                if ((field instanceof Sao.field.One2Many) &&
                        (value[name].length === 0)) {
                    delete value[name];
                }
            }
            return value;
        },
        invalid_fields: function() {
            var fields = {};
            for (var fname in this.model.fields) {
                var field = this.model.fields[fname];
                var invalid = field.get_state_attrs(this).invalid;
                if (invalid) {
                    fields[fname] = invalid;
                }
            }
            return fields;
        },
        get_context: function(local) {
            if (!local) {
                return this.group.context;
            } else {
                return this.group.local_context;
            }
        },
        field_get: function(name) {
            return this.model.fields[name].get(this);
        },
        field_set: function(name, value) {
            this.model.fields[name].set(this, value);
        },
        field_get_client: function(name) {
            return this.model.fields[name].get_client(this);
        },
        field_set_client: function(name, value, force_change) {
            this.model.fields[name].set_client(this, value, force_change);
        },
        default_get: function(rec_name) {
            if (!jQuery.isEmptyObject(this.model.fields)) {
                var context = this.get_context();
                if (context.default_rec_name === undefined) {
                    context.default_rec_name = rec_name;
                }
                var prm = this.model.execute('default_get',
                        [Object.keys(this.model.fields)], context);
                return prm.then(function(values) {
                    if (this.group.parent &&
                            this.group.parent_name in this.group.model.fields) {
                        var parent_field =
                            this.group.model.fields[this.group.parent_name];
                        if (parent_field instanceof Sao.field.Reference) {
                            values[this.group.parent_name] = [
                                this.group.parent.model.name,
                                this.group.parent.id];
                        } else if (parent_field.description.relation ==
                                this.group.parent.model.name) {
                            values[this.group.parent_name] =
                                this.group.parent.id;
                        }
                    }
                    return this.set_default(values);
                }.bind(this));
            }
            return jQuery.when();
        },
        set_default: function(values, validate, display) {
            if (validate === undefined) {
                validate = true;
            }
            if (display === undefined) {
                display = true;
            }
            var promises = [];
            var fieldnames = [];
            for (var fname in values) {
                if (!values.hasOwnProperty(fname)) {
                    continue;
                }
                var value = values[fname];
                if (!(fname in this.model.fields)) {
                    continue;
                }
                if (fname == this.group.exclude_field) {
                    continue;
                }
                if ((this.model.fields[fname] instanceof Sao.field.Many2One) ||
                        (this.model.fields[fname] instanceof Sao.field.Reference)) {
                    var related = fname + '.';
                    this._values[related] = values[related] || {};
                }
                promises.push(this.model.fields[fname].set_default(this, value));
                this._loaded[fname] = true;
                fieldnames.push(fname);
            }
            return jQuery.when.apply(jQuery, promises).then(function() {
                return this.on_change(fieldnames).then(function() {
                    return this.on_change_with(fieldnames).then(function() {
                        var callback = function() {
                            if (display) {
                                return this.group.root_group.screens
                                    .forEach(function(screen) {
                                        return screen.display();
                                    });
                            }
                        }.bind(this);
                        if (validate) {
                            return this.validate(null, true)
                                .then(callback);
                        } else {
                            return callback();
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },
        get_timestamp: function() {
            var timestamps = {};
            timestamps[this.model.name + ',' + this.id] = this._timestamp;
            for (var fname in this.model.fields) {
                if (!this.model.fields.hasOwnProperty(fname)) {
                    continue;
                }
                if (!(fname in this._loaded)) {
                    continue;
                }
                jQuery.extend(timestamps,
                    this.model.fields[fname].get_timestamp(this));
            }
            return timestamps;
        },
        get_eval: function() {
            var value = {};
            for (var key in this.model.fields) {
                if (!this.model.fields.hasOwnProperty(key) && this.id >= 0)
                    continue;
                value[key] = this.model.fields[key].get_eval(this);
            }
            value.id = this.id;
            return value;
        },
        get_on_change_value: function(skip) {
            var value = {};
            for (var key in this.model.fields) {
                if (skip && ~skip.indexOf(key)) {
                    continue;
                }
                if ((this.id >= 0) &&
                        (!this._loaded[key] || !this._changed[key])) {
                    continue;
                }
                value[key] = this.model.fields[key].get_on_change_value(this);
            }
            value.id = this.id;
            return value;
        },
        _get_on_change_args: function(args) {
            var result = {};
            var values = Sao.common.EvalEnvironment(this, 'on_change');
            args.forEach(function(arg) {
                var scope = values;
                arg.split('.').forEach(function(e) {
                    if (scope !== undefined) {
                        scope = scope[e];
                    }
                });
                result[arg] = scope;
            });
            return result;
        },
        on_change: function(fieldnames) {
            var values = {};
            fieldnames.forEach(function(fieldname) {
                var on_change = this.model.fields[fieldname]
                .description.on_change;
                if (!jQuery.isEmptyObject(on_change)) {
                    values = jQuery.extend(values,
                        this._get_on_change_args(on_change));
                }
            }.bind(this));
            if (!jQuery.isEmptyObject(values)) {
                var prm;
                if (fieldnames.length == 1) {
                    prm = this.model.execute(
                        'on_change_' + fieldnames[0],
                        [values], this.get_context())
                        .then(this.set_on_change.bind(this));
                } else {
                    prm = this.model.execute('on_change',
                        [values, fieldnames], this.get_context())
                        .then(function(changes) {
                            return jQuery.when.apply(jQuery,
                                changes.map(this.set_on_change.bind(this)));
                        }.bind(this));
                }
                return prm;
            } else {
                return jQuery.when();
            }
        },
        on_change_with: function(field_names) {
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
            var prms = [];
            var prm;
            var set_on_change = function(fieldname) {
                return function(result) {
                    return this.model.fields[fieldname].set_on_change(
                        this, result);
                };
            };
            fieldnames = Object.keys(fieldnames);
            if (fieldnames) {
                if (fieldnames.length == 1) {
                    prm = this.model.execute(
                        'on_change_with_' + fieldnames[0],
                        [values], this.get_context());
                    prms.push(prm.then(set_on_change(fieldnames[0]).bind(this)));
                } else {
                    prm = this.model.execute(
                        'on_change_with',
                        [values, fieldnames], this.get_context());
                    prms.push(prm.then(this.set_on_change.bind(this)));
                }
            }
            for (fieldname in later) {
                if (!later.hasOwnProperty(fieldname)) {
                    continue;
                }
                on_change_with = this.model.fields[fieldname]
                    .description.on_change_with;
                values = this._get_on_change_args(on_change_with);
                prm = this.model.execute('on_change_with_' + fieldname,
                    [values], this.get_context());
                prms.push(prm.then(set_on_change(fieldname).bind(this)));
            }
            return jQuery.when.apply(jQuery, prms);
        },
        set_on_change: function(values) {
            var fieldname, value;
            var promises = [];
            for (fieldname in values) {
                if (!values.hasOwnProperty(fieldname)) {
                    continue;
                }
                value = values[fieldname];
                if (!(fieldname in this.model.fields)) {
                    continue;
                }
                if ((this.model.fields[fieldname] instanceof
                            Sao.field.Many2One) ||
                        (this.model.fields[fieldname] instanceof
                         Sao.field.Reference)) {
                    var related = fieldname + '.';
                    this._values[related] = values[related] || {};
                }
                promises.push(
                    this.model.fields[fieldname].set_on_change(this, value));
            }
            return jQuery.when.apply(jQuery, promises);
        },
        autocomplete_with: function(fieldname) {
            var promises = [];
            for (var fname in this.model.fields) {
                var field = this.model.fields[fname];
                var autocomplete = field.description.autocomplete || [];
                if (!~autocomplete.indexOf(fieldname)) {
                    continue;
                }
                promises.push(this.do_autocomplete(fname));
            }
            return jQuery.when.apply(jQuery, promises);
        },
        do_autocomplete: function(fieldname) {
            this.autocompletion[fieldname] = [];
            var field = this.model.fields[fieldname];
            var autocomplete = field.description.autocomplete;
            var values = this._get_on_change_args(autocomplete);
            var prm = this.model.execute(
                    'autocomplete_' + fieldname, [values], this.get_context());
            return prm.then(function(result) {
                this.autocompletion[fieldname] = result;
            }.bind(this));
        },
        reset: function(value) {
            this.cancel();
            return this.set(value, true).then(function() {
                var promises = [];
                if (this.group.parent) {
                    promises.push(this.group.parent.on_change(
                        [this.group.child_name]));
                    promises.push(this.group.parent.on_change_with(
                        [this.group.child_name]));
                }
                return jQuery.when.apply(jQuery, promises);
            }.bind(this));
        },
        expr_eval: function(expr) {
            if (typeof(expr) != 'string') return expr;
            if (!expr) {
                return;
            } else if (expr == '[]') {
                return [];
            } else if (expr == '{}') {
                return {};
            }
            var ctx = this.get_eval();
            ctx.context = this.get_context();
            ctx.active_model = this.model.name;
            ctx.active_id = this.id;
            if (this.group.parent && this.group.parent_name) {
                var parent_env = Sao.common.EvalEnvironment(this.group.parent);
                ctx['_parent_' + this.group.parent_name] = parent_env;
            }
            return new Sao.PYSON.Decoder(ctx).decode(expr);
        },
        rec_name: function() {
            var prm = this.model.execute('read', [[this.id], ['rec_name']],
                    this.get_context());
            return prm.then(function(values) {
                return values[0].rec_name;
            });
        },
        validate: function(fields, softvalidation, pre_validate, sync) {
            var validate_fields = function() {
                var result = true;
                for (var fname in this.model.fields) {
                    // Skip not loaded fields if sync and record is not new
                    if (sync && this.id >= 0 && !(fname in this._loaded)) {
                        continue;
                    }
                    if (!this.model.fields.hasOwnProperty(fname)) {
                        continue;
                    }
                    var field = this.model.fields[fname];
                    if (fields && !~fields.indexOf(fname)) {
                        continue;
                    }
                    if (field.description.readonly) {
                        continue;
                    }
                    if (fname == this.group.exclude_field) {
                        continue;
                    }
                    if (!field.validate(this, softvalidation, pre_validate)) {
                        result = false;
                    }
                }
                return result;
            }.bind(this);
            if (sync) {
                return validate_fields();
            } else {
                return this._check_load(fields).then(validate_fields);
            }
        },
        pre_validate: function() {
            if (jQuery.isEmptyObject(this._changed)) {
                return jQuery.Deferred().resolve(true);
            }
            var values = this._get_on_change_args(Object.keys(this._changed));
            return this.model.execute('pre_validate',
                    [values], this.get_context())
                .then(function() {
                    return true;
                }, function() {
                    return false;
                });
        },
        cancel: function() {
            this._loaded = {};
            this._changed = {};
            this._timestamp = null;
            this.button_clicks = {};
        },
        _check_load: function(fields) {
            if (!this.get_loaded(fields)) {
                return this.reload(fields);
            }
            return jQuery.when();
        },
        get_loaded: function(fields) {
            if (!jQuery.isEmptyObject(fields)) {
                var result = true;
                fields.forEach(function(field) {
                    if (!(field in this._loaded) && !(field in this._changed)) {
                        result = false;
                    }
                }.bind(this));
                return result;
            }
            return Sao.common.compare(Object.keys(this.model.fields).sort(),
                    Object.keys(this._loaded).sort());
        },
        get root_parent() {
            var parent = this;
            while (parent.group.parent) {
                parent = parent.group.parent;
            }
            return parent;
        },
        get_path: function(group) {
            var path = [];
            var i = this;
            var child_name = '';
            while (i) {
                path.push([child_name, i.id]);
                if (i.group === group) {
                    break;
                }
                child_name = i.group.child_name;
                i = i.group.parent;
            }
            path.reverse();
            return path;
        },
        get_index_path: function(group) {
            var path = [],
                record = this;
            while (record) {
                path.push(record.group.indexOf(record));
                if (record.group === group) {
                    break;
                }
                record = record.group.parent;
            }
            path.reverse();
            return path;
        },
        get deleted() {
            return Boolean(~this.group.record_deleted.indexOf(this));
        },
        get removed() {
            return Boolean(~this.group.record_removed.indexOf(this));
        },
        get readonly() {
            return this.deleted || this.removed || this.exception;
        },
        set_field_context: function() {
            for (var name in this.model.fields) {
                if (!this.model.fields.hasOwnProperty(name)) {
                    continue;
                }
                var field = this.model.fields[name];
                var value = this._values[name];
                if (!(value instanceof Array)) {
                    continue;
                }
                var context_descriptor = Object.getOwnPropertyDescriptor(
                    value, 'context');
                if (!context_descriptor || !context_descriptor.set) {
                    continue;
                }
                var context = field.description.context;
                if (context) {
                    value.context = this.expr_eval(context);
                }
            }
        },
        get_resources: function(reload) {
            var prm;
            if ((this.id >= 0) && (!this.resources || reload)) {
                prm = this.model.execute(
                    'resources', [this.id], this.get_context())
                    .then(function(resources) {
                        this.resources = resources;
                        return resources;
                    }.bind(this));
            } else {
                prm = jQuery.when(this.resources);
            }
            return prm;
        },
        get_button_clicks: function(name) {
            if (this.id < 0) {
                return jQuery.when();
            }
            var clicks = this.button_clicks[name];
            if (clicks !== undefined) {
                return jQuery.when(clicks);
            }
            return Sao.rpc({
                'method': 'model.ir.model.button.click.get_click',
                'params': [this.model.name, name, this.id, {}],
            }, this.model.session).then(function(clicks) {
                this.button_clicks[name] = clicks;
                return clicks;
            }.bind(this));
        }
    });


    Sao.field = {};

    Sao.field.get = function(type) {
        switch (type) {
            case 'char':
                return Sao.field.Char;
            case 'selection':
                return Sao.field.Selection;
            case 'datetime':
            case 'timestamp':
                return Sao.field.DateTime;
            case 'date':
                return Sao.field.Date;
            case 'time':
                return Sao.field.Time;
            case 'timedelta':
                return Sao.field.TimeDelta;
            case 'float':
                return Sao.field.Float;
            case 'numeric':
                return Sao.field.Numeric;
            case 'integer':
                return Sao.field.Integer;
            case 'boolean':
                return Sao.field.Boolean;
            case 'many2one':
                return Sao.field.Many2One;
            case 'one2one':
                return Sao.field.One2One;
            case 'one2many':
                return Sao.field.One2Many;
            case 'many2many':
                return Sao.field.Many2Many;
            case 'reference':
                return Sao.field.Reference;
            case 'binary':
                return Sao.field.Binary;
            case 'dict':
                return Sao.field.Dict;
            default:
                return Sao.field.Char;
        }
    };

    Sao.field.Field = Sao.class_(Object, {
        _default: null,
        init: function(description) {
            this.description = description;
            this.name = description.name;
            this.views = new Set();
        },
        set: function(record, value) {
            record._values[this.name] = value;
        },
        get: function(record) {
            var value = record._values[this.name];
            if (value === undefined) {
                value = this._default;
            }
            return value;
        },
        set_client: function(record, value, force_change) {
            var previous_value = this.get(record);
            this.set(record, value);
            // Use stringify to compare object instance like Number for Decimal
            if (JSON.stringify(previous_value) !=
                JSON.stringify(this.get(record))) {
                record._changed[this.name] = true;
                this.changed(record).done(function() {
                    record.validate(null, true).then(function() {
                        record.group.changed();
                    });
                });
            } else if (force_change) {
                record._changed[this.name] = true;
                this.changed(record).done(function() {
                    record.validate(null, true).then(function() {
                        var root_group = record.group.root_group;
                        root_group.screens.forEach(function(screen) {
                            screen.display();
                        });
                    });
                });
            }
        },
        get_client: function(record) {
            return this.get(record);
        },
        set_default: function(record, value) {
            this.set(record, value);
            record._changed[this.name] = true;
        },
        set_on_change: function(record, value) {
            record._values[this.name] = value;
            record._changed[this.name] = true;
        },
        changed: function(record) {
            return record.on_change([this.name]).then(function() {
                return record.on_change_with([this.name]).then(function() {
                    return record.autocomplete_with(this.name).then(function() {
                        record.set_field_context();
                    });
                }.bind(this));
            }.bind(this));
        },
        get_timestamp: function(record) {
            return {};
        },
        get_context: function(record, record_context, local) {
            var context;
            if (record_context) {
                context = jQuery.extend({}, record_context);
            } else {
                context = record.get_context(local);
            }
            jQuery.extend(context,
                record.expr_eval(this.description.context || {}));
            return context;
        },
        get_search_context: function(record) {
            var context = this.get_context(record);
            jQuery.extend(context,
                record.expr_eval(this.description.search_context || {}));
            return context;
        },
        get_search_order: function(record) {
            return record.expr_eval(this.description.search_order || null);
        },
        get_domains: function(record, pre_validate) {
            var inversion = new Sao.common.DomainInversion();
            var screen_domain = inversion.domain_inversion(
                    [record.group.domain4inversion(), pre_validate || []],
                    this.name, Sao.common.EvalEnvironment(record));
            if ((typeof screen_domain == 'boolean') && !screen_domain) {
                screen_domain = [['id', '=', null]];
            } else if ((typeof screen_domain == 'boolean') && screen_domain) {
                screen_domain = [];
            }
            var attr_domain = record.expr_eval(this.description.domain || []);
            return [screen_domain, attr_domain];
        },
        get_domain: function(record) {
            var domains = this.get_domains(record);
            var screen_domain = domains[0];
            var attr_domain = domains[1];
            var inversion = new Sao.common.DomainInversion();
            return inversion.concat(
                    [inversion.localize_domain(screen_domain), attr_domain]);
        },
        validation_domains: function(record, pre_validate) {
            var inversion = new Sao.common.DomainInversion();
            return inversion.concat(this.get_domains(record, pre_validate));
        },
        get_eval: function(record) {
            return this.get(record);
        },
        get_on_change_value: function(record) {
            return this.get_eval(record);
        },
        set_state: function(record, states) {
            if (states === undefined) {
                states = ['readonly', 'required', 'invisible'];
            }
            var state_changes = record.expr_eval(
                    this.description.states || {});
            states.forEach(function(state) {
                if ((state == 'readonly') && this.description.readonly) {
                    return;
                }
                if (state_changes[state] !== undefined) {
                    this.get_state_attrs(record)[state] = state_changes[state];
                } else if (this.description[state] !== undefined) {
                    this.get_state_attrs(record)[state] =
                        this.description[state];
                }
            }.bind(this));
            if (record.group.readonly ||
                    this.get_state_attrs(record).domain_readonly) {
                this.get_state_attrs(record).readonly = true;
            }
        },
        get_state_attrs: function(record) {
            if (!(this.name in record.state_attrs)) {
                record.state_attrs[this.name] = jQuery.extend(
                        {}, this.description);
            }
            if (record.group.readonly || record.readonly) {
                record.state_attrs[this.name].readonly = true;
            }
            return record.state_attrs[this.name];
        },
        _is_empty: function(record) {
            return !this.get_eval(record);
        },
        check_required: function(record) {
            var state_attrs = this.get_state_attrs(record);
            if (state_attrs.required == 1) {
                if (this._is_empty(record) && (state_attrs.readonly != 1)) {
                    return false;
                }
            }
            return true;
        },
        validate: function(record, softvalidation, pre_validate) {
            if (this.description.readonly) {
                return true;
            }
            var invalid = false;
            this.get_state_attrs(record).domain_readonly = false;
            var inversion = new Sao.common.DomainInversion();
            var domain = inversion.simplify(this.validation_domains(record,
                        pre_validate));
            if (!softvalidation) {
                if (!this.check_required(record)) {
                    invalid = 'required';
                }
            }
            if (typeof domain == 'boolean') {
                if (!domain) {
                    invalid = 'domain';
                }
            } else if (Sao.common.compare(domain, [['id', '=', null]])) {
                invalid = 'domain';
            } else {
                var uniques = inversion.unique_value(domain);
                var unique = uniques[0];
                var leftpart = uniques[1];
                var value = uniques[2];
                if (unique) {
                    // If the inverted domain is so constraint that only one
                    // value is possible we should use it. But we must also pay
                    // attention to the fact that the original domain might be
                    // a 'OR' domain and thus not preventing the modification
                    // of fields.
                    if (value === false) {
                        // XXX to remove once server domains are fixed
                        value = null;
                    }
                    var setdefault = true;
                    var original_domain;
                    if (!jQuery.isEmptyObject(record.group.domain)) {
                        original_domain = inversion.merge(record.group.domain);
                    } else {
                        original_domain = inversion.merge(domain);
                    }
                    var domain_readonly = original_domain[0] == 'AND';
                    if (leftpart.contains('.')) {
                        var recordpart = leftpart.split('.', 1)[0];
                        var localpart = leftpart.split('.', 1)[1];
                        var constraintfields = [];
                        if (domain_readonly) {
                            inversion.localize_domain(
                                    original_domain.slice(1))
                                .forEach(function(leaf) {
                                    constraintfields.push(leaf);
                                });
                        }
                        if ((localpart != 'id') ||
                                !~constraintfields.indexOf(recordpart)) {
                            setdefault = false;
                        }
                    }
                    if (setdefault && !pre_validate) {
                        this.set_client(record, value);
                        this.get_state_attrs(record).domain_readonly =
                            domain_readonly;
                    }
                }
                if (!inversion.eval_domain(domain,
                            Sao.common.EvalEnvironment(record))) {
                    invalid = domain;
                }
            }
            this.get_state_attrs(record).invalid = invalid;
            return !invalid;
        }
    });

    Sao.field.Char = Sao.class_(Sao.field.Field, {
        _default: '',
        get: function(record) {
            return Sao.field.Char._super.get.call(this, record) || this._default;
        }
    });

    Sao.field.Selection = Sao.class_(Sao.field.Field, {
        _default: null
    });

    Sao.field.DateTime = Sao.class_(Sao.field.Field, {
        _default: null,
        time_format: function(record) {
            return record.expr_eval(this.description.format);
        },
        set_client: function(record, value, force_change) {
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
                }
            }
            Sao.field.DateTime._super.set_client.call(this, record, value,
                force_change);
        },
        date_format: function(record) {
            var context = this.get_context(record);
            return Sao.common.date_format(context.date_format);
        }
    });

    Sao.field.Date = Sao.class_(Sao.field.Field, {
        _default: null,
        set_client: function(record, value, force_change) {
            if (value && !value.isDate) {
                value.isDate = true;
                value.isDateTime = false;
            }
            Sao.field.Date._super.set_client.call(this, record, value,
                force_change);
        },
        date_format: function(record) {
            var context = this.get_context(record);
            return Sao.common.date_format(context.date_format);
        }
    });

    Sao.field.Time = Sao.class_(Sao.field.Field, {
        _default: null,
        time_format: function(record) {
            return record.expr_eval(this.description.format);
        },
        set_client: function(record, value, force_change) {
            if (value && (value.isDate || value.isDateTime)) {
                value = Sao.Time(value.hour(), value.minute(),
                    value.second(), value.millisecond());
            }
            Sao.field.Time._super.set_client.call(this, record, value,
                force_change);
        }
    });

    Sao.field.TimeDelta = Sao.class_(Sao.field.Field, {
        _default: null,
        converter: function(group) {
            return group.context[this.description.converter];
        },
        set_client: function(record, value, force_change) {
            if (typeof(value) == 'string') {
                value = Sao.common.timedelta.parse(
                    value, this.converter(record.group));
            }
            Sao.field.TimeDelta._super.set_client.call(
                this, record, value, force_change);
        },
        get_client: function(record) {
            var value = Sao.field.TimeDelta._super.get_client.call(
                this, record);
            return Sao.common.timedelta.format(
                value, this.converter(record.group));
        }
    });

    Sao.field.Float = Sao.class_(Sao.field.Field, {
        _default: null,
        digits: function(record, factor) {
            if (factor === undefined) {
                factor = 1;
            }
            var digits = record.expr_eval(this.description.digits);
            if (!digits || !digits.every(function(e) {
                return e !== null;
            })) {
                return;
            }
            var shift = Math.round(Math.log(Math.abs(factor)) / Math.LN10);
            return [digits[0] + shift, digits[1] - shift];
        },
        check_required: function(record) {
            var state_attrs = this.get_state_attrs(record);
            if (state_attrs.required == 1) {
                if ((this.get(record) === null) &&
                    (state_attrs.readonly != 1)) {
                    return false;
                }
            }
            return true;
        },
        convert: function(value) {
            if (!value && (value !== 0)) {
                return null;
            }
            value = Number(value);
            if (isNaN(value)) {
                value = this._default;
            }
            return value;
        },
        apply_factor: function(record, value, factor) {
            if (value !== null) {
                value /= factor;
                var digits = this.digits(record);
                if (digits) {
                    // Round to avoid float precision error
                    // after the division by factor
                    value = this.convert(value.toFixed(digits[1]));
                }
            }
            return value;
        },
        set_client: function(record, value, force_change, factor) {
            if (factor === undefined) {
                factor = 1;
            }
            value = this.apply_factor(record, this.convert(value), factor);
            Sao.field.Float._super.set_client.call(this, record, value,
                force_change);
        },
        get_client: function(record, factor) {
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
                return (value * factor).toLocaleString(
                    Sao.i18n.BC47(Sao.i18n.getlang()), options);
            } else {
                return '';
            }
        }
    });

    Sao.field.Numeric = Sao.class_(Sao.field.Float, {
        convert: function(value) {
            if (!value && (value !== 0)) {
                return null;
            }
            value = new Sao.Decimal(value);
            if (isNaN(value.valueOf())) {
                value = this._default;
            }
            return value;
        },
    });

    Sao.field.Integer = Sao.class_(Sao.field.Float, {
        convert: function(value) {
            value = parseInt(value, 10);
            if (isNaN(value)) {
                value = this._default;
            }
            return value;
        }
    });

    Sao.field.Boolean = Sao.class_(Sao.field.Field, {
        _default: false,
        set_client: function(record, value, force_change) {
            value = Boolean(value);
            Sao.field.Boolean._super.set_client.call(this, record, value,
                force_change);
        },
        get: function(record) {
            return Boolean(record._values[this.name]);
        },
        get_client: function(record) {
            return Boolean(record._values[this.name]);
        }
    });

    Sao.field.Many2One = Sao.class_(Sao.field.Field, {
        _default: null,
        check_required: function(record) {
            var state_attrs = this.get_state_attrs(record);
            if (state_attrs.required == 1) {
                if ((this.get(record) === null) &&
                    (state_attrs.readonly != 1)) {
                    return false;
                }
            }
            return true;
        },
        get_client: function(record) {
            var rec_name = (record._values[this.name + '.'] || {}).rec_name;
            if (rec_name === undefined) {
                this.set(record, this.get(record));
                rec_name = (
                    record._values[this.name + '.'] || {}).rec_name || '';
            }
            return rec_name;
        },
        set: function(record, value) {
            var rec_name = (
                record._values[this.name + '.'] || {}).rec_name || '';
            var store_rec_name = function(rec_name) {
                Sao.setdefault(
                    record._values, this.name + '.', {})
                    .rec_name = rec_name[0].rec_name;
            };
            if (!rec_name && (value >= 0) && (value !== null)) {
                var model_name = record.model.fields[this.name].description
                    .relation;
                Sao.rpc({
                    'method': 'model.' + model_name + '.read',
                    'params': [[value], ['rec_name'], record.get_context()]
                }, record.model.session).done(store_rec_name.bind(this)).done(
                        function() {
                            record.group.root_group.screens.forEach(
                                function(screen) {
                                    screen.display();
                            });
                       });
            } else {
                store_rec_name.call(this, [{'rec_name': rec_name}]);
            }
            record._values[this.name] = value;
        },
        set_client: function(record, value, force_change) {
            var rec_name;
            if (value instanceof Array) {
                rec_name = value[1];
                value = value[0];
            } else {
                if (value == this.get(record)) {
                    rec_name = (
                        record._values[this.name + '.'] || {}).rec_name || '';
                } else {
                    rec_name = '';
                }
            }
            Sao.setdefault(
                record._values, this.name + '.', {}).rec_name = rec_name;
            Sao.field.Many2One._super.set_client.call(this, record, value,
                    force_change);
        },
        get_context: function(record, record_context, local) {
            var context = Sao.field.Many2One._super.get_context.call(
                this, record, record_context, local);
            if (this.description.datetime_field) {
                context._datetime = record.get_eval()[
                    this.description.datetime_field];
            }
            return context;
        },
        validation_domains: function(record, pre_validate) {
            return this.get_domains(record, pre_validate)[0];
        },
        get_domain: function(record) {
            var domains = this.get_domains(record);
            var screen_domain = domains[0];
            var attr_domain = domains[1];
            var inversion = new Sao.common.DomainInversion();
            return inversion.concat([
                    inversion.localize_domain(screen_domain, this.name),
                    attr_domain]);
        },
        get_on_change_value: function(record) {
            if ((record.group.parent_name == this.name) &&
                    record.group.parent) {
                return record.group.parent.get_on_change_value(
                        [record.group.child_name]);
            }
            return Sao.field.Many2One._super.get_on_change_value.call(
                    this, record);
        }
    });

    Sao.field.One2One = Sao.class_(Sao.field.Many2One, {
    });

    Sao.field.One2Many = Sao.class_(Sao.field.Field, {
        init: function(description) {
            Sao.field.One2Many._super.init.call(this, description);
        },
        _default: null,
        _set_value: function(record, value, default_, modified) {
            this._set_default_value(record);
            var group = record._values[this.name];
            var prm = jQuery.when();
            if (jQuery.isEmptyObject(value)) {
                value = [];
            }
            var mode;
            if (jQuery.isEmptyObject(value) ||
                    !isNaN(parseInt(value[0], 10))) {
                mode = 'list ids';
            } else {
                mode = 'list values';
            }
            if (mode == 'list values') {
                var context = this.get_context(record);
                var field_names = {};
                value.forEach(function(val) {
                    for (var fieldname in val) {
                        if (!val.hasOwnProperty(fieldname)) {
                            continue;
                        }
                        if (!(fieldname in group.model.fields) &&
                                (!~fieldname.indexOf('.'))) {
                            field_names[fieldname] = true;
                        }
                    }
                });
                if (!jQuery.isEmptyObject(field_names)) {
                    var args = {
                        'method': 'model.' + this.description.relation +
                            '.fields_get',
                        'params': [Object.keys(field_names), context]
                    };
                    prm = Sao.rpc(args, record.model.session);
                }
            }
            var set_value = function(fields) {
                var promises = [];
                if (!jQuery.isEmptyObject(fields)) {
                    group.add_fields(fields);
                }
                if (mode == 'list ids') {
                    for (var i = 0, len = group.length; i < len; i++) {
                        var old_record = group[i];
                        if (!~value.indexOf(old_record.id)) {
                            group.remove(old_record, true);
                        }
                    }
                    group.load(value, modified);
                } else {
                    value.forEach(function(vals) {
                        var new_record = group.new_(false);
                        if (default_) {
                            // Don't validate as parent will validate
                            promises.push(new_record.set_default(
                                vals, false, false));
                            group.add(new_record, -1, false);
                        } else {
                            promises.push(new_record.set(vals));
                            group.push(new_record);
                        }
                    });
                }
                return jQuery.when.apply(jQuery, promises);
            };
            return prm.then(set_value.bind(this));
        },
        set: function(record, value, _default) {
            if (_default === undefined) {
                _default = false;
            }
            var group = record._values[this.name];
            var model;
            if (group !== undefined) {
                model = group.model;
                group.destroy();
            } else if (record.model.name == this.description.relation) {
                model = record.model;
            } else {
                model = new Sao.Model(this.description.relation);
            }
            record._values[this.name] = undefined;
            this._set_default_value(record, model);
            return this._set_value(record, value, _default);
        },
        get: function(record) {
            var group = record._values[this.name];
            if (group === undefined) {
                return [];
            }
            var record_removed = group.record_removed;
            var record_deleted = group.record_deleted;
            var result = [];
            var parent_name = this.description.relation_field || '';
            var to_add = [];
            var to_create = [];
            var to_write = [];
            for (var i = 0, len = group.length; i < len; i++) {
                var record2 = group[i];
                if (~record_removed.indexOf(record2) ||
                        ~record_deleted.indexOf(record2)) {
                    continue;
                }
                var values;
                if (record2.id >= 0) {
                    if (record2.has_changed()) {
                        values = record2.get();
                        delete values[parent_name];
                        if (!jQuery.isEmptyObject(values)) {
                            to_write.push([record2.id]);
                            to_write.push(values);
                        }
                        to_add.push(record2.id);
                    }
                } else {
                    values = record2.get();
                    delete values[parent_name];
                    to_create.push(values);
                }
            }
            if (!jQuery.isEmptyObject(to_add)) {
                result.push(['add', to_add]);
            }
            if (!jQuery.isEmptyObject(to_create)) {
                result.push(['create', to_create]);
            }
            if (!jQuery.isEmptyObject(to_write)) {
                result.push(['write'].concat(to_write));
            }
            if (!jQuery.isEmptyObject(record_removed)) {
                result.push(['remove', record_removed.map(function(r) {
                    return r.id;
                })]);
            }
            if (!jQuery.isEmptyObject(record_deleted)) {
                result.push(['delete', record_deleted.map(function(r) {
                    return r.id;
                })]);
            }
            return result;
        },
        set_client: function(record, value, force_change) {
            // domain inversion try to set None as value
            if (value === null) {
                value = [];
            }
            // domain inversion could try to set id as value
            if (typeof value == 'number') {
                value = [value];
            }

            var previous_ids = this.get_eval(record);
            var modified = !Sao.common.compare(
                previous_ids.sort(), value.sort());
            this._set_value(record, value, false, modified);
            if (modified) {
                record._changed[this.name] = true;
                this.changed(record).done(function() {
                    record.validate(null, true).then(function() {
                        record.group.changed();
                    });
                });
            } else if (force_change) {
                record._changed[this.name] = true;
                this.changed(record).done(function() {
                    record.validate(null, true).then(function() {
                        var root_group = record.group.root_group;
                        root_group.screens.forEach(function(screen) {
                            screen.display();
                        });
                    });
                });
            }
        },
        get_client: function(record) {
            this._set_default_value(record);
            return record._values[this.name];
        },
        set_default: function(record, value) {
            record._changed[this.name] = true;
            return this.set(record, value, true);
        },
        set_on_change: function(record, value) {
            record._changed[this.name] = true;
            this._set_default_value(record);
            if (value instanceof Array) {
                return this._set_value(record, value, false, true);
            }
            var prm = jQuery.when();
            if (value.add || value.update) {
                var context = this.get_context(record);
                var fields = record._values[this.name].model.fields;
                var field_names = {};
                var adding_values = [];
                if (value.add) {
                    for (var i=0; i < value.add.length; i++) {
                        adding_values.push(value.add[i][1]);
                    }
                }
                [adding_values, value.update].forEach(function(l) {
                    if (!jQuery.isEmptyObject(l)) {
                        l.forEach(function(v) {
                            Object.keys(v).forEach(function(f) {
                                if (!(f in fields) &&
                                    (f != 'id') &&
                                    (!~f.indexOf('.'))) {
                                        field_names[f] = true;
                                    }
                            });
                        });
                    }
                });
                if (!jQuery.isEmptyObject(field_names)) {
                    var args = {
                        'method': 'model.' + this.description.relation +
                            '.fields_get',
                        'params': [Object.keys(field_names), context]
                    };
                    prm = Sao.rpc(args, record.model.session);
                }
            }

            var to_remove = [];
            var group = record._values[this.name];
            group.forEach(function(record2) {
                if (!record2.id) {
                    to_remove.push(record2);
                }
            });
            if (value.remove) {
                value.remove.forEach(function(record_id) {
                    var record2 = group.get(record_id);
                    if (record2) {
                        to_remove.push(record2);
                    }
                }.bind(this));
            }
            to_remove.forEach(function(record2) {
                group.remove(record2, false, true, false);
            }.bind(this));

            if (value.add || value.update) {
                prm = prm.then(function(fields) {
                    var promises = [];
                    group.add_fields(fields);
                    if (value.add) {
                        value.add.forEach(function(vals) {
                            var index = vals[0];
                            var data = vals[1];
                            var new_record = group.new_(false);
                            group.add(new_record, index, false);
                            promises.push(new_record.set_on_change(data));
                        });
                    }
                    if (value.update) {
                        value.update.forEach(function(vals) {
                            if (!vals.id) {
                                return;
                            }
                            var record2 = group.get(vals.id);
                            if (record2) {
                                promises.push(record2.set_on_change(vals));
                            }
                        });
                    }
                    return jQuery.when.apply(jQuery, promises);
                }.bind(this));
            }
            return prm;
        },
        _set_default_value: function(record, model) {
            if (record._values[this.name] !== undefined) {
                return;
            }
            if (!model) {
                model = new Sao.Model(this.description.relation);
            }
            if (record.model.name == this.description.relation) {
                model = record.model;
            }
            var context = record.expr_eval(this.description.context || {});
            var group = Sao.Group(model, context, []);
            group.set_parent(record);
            group.parent_name = this.description.relation_field;
            group.child_name = this.name;
            group.parent_datetime_field = this.description.datetime_field;
            record._values[this.name] = group;
        },
        get_timestamp: function(record) {
            var timestamps = {};
            var group = record._values[this.name] || [];
            var records = group.filter(function(record) {
                return record.has_changed();
            });
            var record2;
            jQuery.extend(records, group.record_removed, group.record_deleted)
            .forEach(function(record) {
                jQuery.extend(timestamps, record.get_timestamp());
            });
            return timestamps;
        },
        get_eval: function(record) {
            var result = [];
            var group = record._values[this.name];
            if (group === undefined) return result;

            var record_removed = group.record_removed;
            var record_deleted = group.record_deleted;
            for (var i = 0, len = record._values[this.name].length; i < len;
                    i++) {
                var record2 = group[i];
                if (~record_removed.indexOf(record2) ||
                        ~record_deleted.indexOf(record2))
                    continue;
                result.push(record2.id);
            }
            return result;
        },
        get_on_change_value: function(record) {
            var result = [];
            var group = record._values[this.name];
            if (group === undefined) return result;
            for (var i = 0, len = record._values[this.name].length; i < len;
                    i++) {
                var record2 = group[i];
                if (!record2.deleted && !record2.removed)
                    result.push(record2.get_on_change_value(
                                [this.description.relation_field || '']));
            }
            return result;
        },
        get_removed_ids: function(record) {
            return record._values[this.name].record_removed.map(function(r) {
                return r.id;
            });
        },
        get_domain: function(record) {
            var domains = this.get_domains(record);
            var attr_domain = domains[1];
            // Forget screen_domain because it only means at least one record
            // and not all records
            return attr_domain;
        },
        validation_domains: function(record, pre_validate) {
            return this.get_domains(record, pre_validate)[0];
        },
        validate: function(record, softvalidation, pre_validate) {
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
            return test;
        },
        set_state: function(record, states) {
            this._set_default_value(record);
            Sao.field.One2Many._super.set_state.call(this, record, states);
        }
    });

    Sao.field.Many2Many = Sao.class_(Sao.field.One2Many, {
        get_on_change_value: function(record) {
            return this.get_eval(record);
        }
    });

    Sao.field.Reference = Sao.class_(Sao.field.Field, {
        _default: null,
        get_client: function(record) {
            if (record._values[this.name]) {
                var model = record._values[this.name][0];
                var name = (
                    record._values[this.name + '.'] || {}).rec_name || '';
                return [model, name];
            } else {
                return null;
            }
        },
        get: function(record) {
            if (record._values[this.name] &&
                record._values[this.name][0] &&
                record._values[this.name][1] !== null &&
                record._values[this.name][1] >= -1) {
                return record._values[this.name].join(',');
            }
            return null;
        },
        set_client: function(record, value, force_change) {
            if (value) {
                if (typeof(value) == 'string') {
                    value = value.split(',');
                }
                var ref_model = value[0];
                var ref_id = value[1];
                var rec_name;
                if (ref_id instanceof Array) {
                    rec_name = ref_id[1];
                    ref_id = ref_id[0];
                } else {
                    if (ref_id && !isNaN(parseInt(ref_id, 10))) {
                        ref_id = parseInt(ref_id, 10);
                    }
                    if ([ref_model, ref_id].join(',') == this.get(record)) {
                        rec_name = (
                            record._values[this.name + '.'] || {}).rec_name || '';
                    } else {
                        rec_name = '';
                    }
                }
                Sao.setdefault(
                    record._values, this.name + '.', {}).rec_name = rec_name;
                value = [ref_model, ref_id];
            }
            Sao.field.Reference._super.set_client.call(
                    this, record, value, force_change);
        },
        set: function(record, value) {
            if (!value) {
                record._values[this.name] = this._default;
                return;
            }
            var ref_model, ref_id;
            if (typeof(value) == 'string') {
                ref_model = value.split(',')[0];
                ref_id = value.split(',')[1];
                if (!ref_id) {
                    ref_id = null;
                } else if (!isNaN(parseInt(ref_id, 10))) {
                    ref_id = parseInt(ref_id, 10);
                }
            } else {
                ref_model = value[0];
                ref_id = value[1];
            }
            var rec_name = (
                record._values[this.name + '.'] || {}).rec_name || '';
            var store_rec_name = function(rec_name) {
                Sao.setdefault(
                    record._values, this.name + '.', {}).rec_name = rec_name;
            }.bind(this);
            if (ref_model && ref_id !== null && ref_id >= 0) {
                if (!rec_name && ref_id >= 0) {
                    Sao.rpc({
                        'method': 'model.' + ref_model + '.read',
                        'params': [[ref_id], ['rec_name'], record.get_context()]
                    }, record.model.session).done(function(result) {
                        store_rec_name(result[0].rec_name);
                    });
                }
            } else if (ref_model) {
                rec_name = '';
            } else {
                rec_name = ref_id;
            }
            record._values[this.name] = [ref_model, ref_id];
            store_rec_name(rec_name);
        },
        get_on_change_value: function(record) {
            if ((record.group.parent_name == this.name) &&
                    record.group.parent) {
                return [record.group.parent.model.name,
                    record.group.parent.get_on_change_value(
                        [record.group.child_name])];
            }
            return Sao.field.Reference._super.get_on_change_value.call(
                    this, record);
        },
        get_context: function(record, record_context, local) {
            var context = Sao.field.Reference._super.get_context.call(
                this, record, record_context, local);
            if (this.description.datetime_field) {
                context._datetime = record.get_eval()[
                    this.description.datetime_field];
            }
            return context;
        },
        validation_domains: function(record, pre_validate) {
            return this.get_domains(record, pre_validate)[0];
        },
        get_domain: function(record) {
            var model = null;
            if (record._values[this.name]) {
                model = record._values[this.name][0];
            }
            var domains = this.get_domains(record);
            var screen_domain = domains[0];
            var attr_domain = domains[1];
            var inversion = new Sao.common.DomainInversion();
            screen_domain = inversion.prepare_reference_domain(
                screen_domain, this.name);
            return inversion.concat([inversion.localize_domain(
                        inversion.filter_leaf(screen_domain, this.name, model),
                        undefined, true), attr_domain]);
        },
        get_models: function(record) {
            var domains = this.get_domains(record);
            var inversion = new Sao.common.DomainInversion();
            return inversion.extract_reference_models(
                inversion.concat(domains[0], domains[1]),
                this.name);
        },
        _is_empty: function(record) {
            var result = Sao.field.Reference._super._is_empty.call(
                this, record);
            if (!result && record._values[this.name][1] < 0) {
                result = true;
            }
            return result;
        },
    });

    Sao.field.Binary = Sao.class_(Sao.field.Field, {
        _default: null,
        get_size: function(record) {
            var data = record._values[this.name] || 0;
            if (data instanceof Uint8Array) {
                return data.length;
            }
            return data;
        },
        get_data: function(record) {
            var data = record._values[this.name] || [];
            var prm = jQuery.when(data);
            if (!(data instanceof Uint8Array)) {
                if (record.id < 0) {
                    return prm;
                }
                var context = record.get_context();
                prm = record.model.execute('read', [[record.id], [this.name]],
                    context).then(function(data) {
                        return data[0][this.name];
                    }.bind(this));
            }
            return prm;
        }
    });

    Sao.field.Dict = Sao.class_(Sao.field.Field, {
        _default: {},
        init: function(description) {
            Sao.field.Dict._super.init.call(this, description);
            this.schema_model = new Sao.Model(description.schema_model);
            this.keys = {};
        },
        set: function(record, value) {
            if (value) {
                // Order keys to allow comparison with stringify
                var keys = [];
                for (var key in value) {
                    keys.push(key);
                }
                keys.sort();
                var new_value = {};
                for (var index in keys) {
                    key = keys[index];
                    new_value[key] = value[key];
                }
                value = new_value;
            }
            Sao.field.Dict._super.set.call(this, record, value);
        },
        get: function(record) {
            return (Sao.field.Dict._super.get.call(this, record) ||
                    this._default);
        },
        get_client: function(record) {
            return (Sao.field.Dict._super.get_client.call(this, record) ||
                    this._default);
        },
        validation_domains: function(record, pre_validate) {
            return this.get_domains(record, pre_validate)[0];
        },
        get_domain: function(record) {
            var inversion = new Sao.common.DomainInversion();
            var domains = this.get_domains(record);
            var screen_domain = domains[0];
            var attr_domain = domains[1];
            return inversion.concat([
                    inversion.localize_domain(screen_domain),
                    attr_domain]);
        },
        date_format: function(record) {
            var context = this.get_context(record);
            return Sao.common.date_format(context.date_format);
        },
        time_format: function(record) {
            return '%X';
        },
        add_keys: function(keys, record) {
            var schema_model = this.description.schema_model;
            var context = this.get_context(record);
            var domain = this.get_domain(record);
            var batchlen = Math.min(10, Sao.config.limit);

            keys = jQuery.extend([], keys);
            var get_keys = function(key_ids) {
                return this.schema_model.execute('get_keys',
                        [key_ids], context).then(update_keys);
            }.bind(this);
            var update_keys = function(values) {
                for (var i = 0, len = values.length; i < len; i++) {
                    var k = values[i];
                    this.keys[k.name] = k;
                }
            }.bind(this);

            var prms = [];
            while (keys.length > 0) {
                var sub_keys = keys.splice(0, batchlen);
                prms.push(this.schema_model.execute('search',
                            [[['name', 'in', sub_keys], domain],
                            0, Sao.config.limit, null], context)
                        .then(get_keys));
            }
            return jQuery.when.apply(jQuery, prms);
        },
        add_new_keys: function(ids, record) {
            var context = this.get_context(record);
            return this.schema_model.execute('get_keys', [ids], context)
                .then(function(new_fields) {
                    var names = [];
                    new_fields.forEach(function(new_field) {
                        this.keys[new_field.name] = new_field;
                        names.push(new_field.name);
                    }.bind(this));
                    return names;
                }.bind(this));
        },
        validate: function(record, softvalidation, pre_validate) {
            var valid = Sao.field.Dict._super.validate.call(
                this, record, softvalidation, pre_validate);

            if (this.description.readonly) {
                return valid;
            }

            var decoder = new Sao.PYSON.Decoder();
            var field_value = this.get_eval(record);
            var domain = [];
            for (var key in field_value) {
                if (!(key in this.keys)) {
                    continue;
                }
                var key_domain = this.keys[key].domain;
                if (key_domain) {
                    domain.push(decoder.decode(key_domain));
                }
            }

            var inversion = new Sao.common.DomainInversion();
            var valid_value = inversion.eval_domain(domain, field_value);
            if (!valid_value) {
                this.get_state_attrs(record).invalid = 'domain';
            }

            return valid && valid_value;
        }
    });
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Tab = Sao.class_(Object, {
        init: function(attributes) {
            Sao.Tab.tabs.push(this);
            this.attributes = jQuery.extend({}, attributes);
            this.buttons = {};
            this.menu_buttons = {};
            this.id = 'tab-' + Sao.Tab.counter++;
            this.name = '';
            this.name_el = jQuery('<span/>');
            this.view_prm = jQuery.when();
        },
        menu_def: function() {
            return [
                {
                    id: 'switch_',
                    icon: 'tryton-switch',
                    label: Sao.i18n.gettext('Switch'),
                    tooltip: Sao.i18n.gettext('Switch view'),
                }, {
                    id: 'previous',
                    icon: 'tryton-back',
                    label: Sao.i18n.gettext('Previous'),
                    tooltip: Sao.i18n.gettext('Previous Record')
                }, {
                    id: 'next',
                    icon: 'tryton-forward',
                    label: Sao.i18n.gettext('Next'),
                    tooltip: Sao.i18n.gettext('Next Record'),
                }, {
                    id: 'search',
                    icon: 'tryton-search',
                    label: Sao.i18n.gettext('Search'),
                }, null, {
                    id: 'new_',
                    icon: 'tryton-create',
                    label: Sao.i18n.gettext('New'),
                    tooltip: Sao.i18n.gettext('Create a new record'),
                }, {
                    id: 'save',
                    icon: 'tryton-save',
                    label: Sao.i18n.gettext('Save'),
                    tooltip: Sao.i18n.gettext('Save this record'),
                }, {
                    id: 'reload',
                    icon: 'tryton-refresh',
                    label: Sao.i18n.gettext('Reload/Undo'),
                    tooltip: Sao.i18n.gettext('Reload'),
                }, {
                    id: 'copy',
                    icon: 'tryton-copy',
                    label: Sao.i18n.gettext('Duplicate'),
                }, {
                    id: 'delete_',
                    icon: 'tryton-delete',
                    label: Sao.i18n.gettext('Delete'),
                }, null, {
                    id: 'logs',
                    icon: 'tryton-log',
                    label: Sao.i18n.gettext('View Logs...'),
                }, {
                    id: (this.screen &&
                        Sao.common.MODELHISTORY.contains(this.screen.model_name)) ?
                        'revision': null,
                    icon: 'tryton-history',
                    label: Sao.i18n.gettext('Show revisions...'),
                }, null, {
                    id: 'attach',
                    icon: 'tryton-attach',
                    label: Sao.i18n.gettext('Attachment'),
                    tooltip: Sao.i18n.gettext('Add an attachment to the record'),
                    dropdown: true,
                }, {
                    id: 'note',
                    icon: 'tryton-note',
                    label: Sao.i18n.gettext('Note'),
                    tooltip: Sao.i18n.gettext('Add a note to the record'),
                }, {
                    id: 'action',
                    icon: 'tryton-launch',
                    label: Sao.i18n.gettext('Action'),
                }, null, {
                    id: 'relate',
                    icon: 'tryton-link',
                    label: Sao.i18n.gettext('Relate'),
                }, {
                    id: 'print',
                    icon: 'tryton-print',
                    label: Sao.i18n.gettext('Print'),
                }, null, {
                    id: 'export',
                    icon: 'tryton-export',
                    label: Sao.i18n.gettext('Export'),
                }, {
                    id: 'import',
                    icon: 'tryton-import',
                    label: Sao.i18n.gettext('Import'),
                }, null, {
                    id: 'close',
                    icon: 'tryton-close',
                    label: Sao.i18n.gettext('Close Tab'),
                },
            ];
        },
        create_tabcontent: function() {
            this.el = jQuery('<div/>', {
                'class': this.class_
            });

            var toolbar = this.create_toolbar().appendTo(this.el);
            this.title = toolbar.find('.title');

            this.content = jQuery('<div/>').appendTo(this.el);

            if (this.info_bar) {
                this.el.append(this.info_bar.el);
            }
        },
        set_menu: function(menu) {
            var previous;
            this.menu_def().forEach(function(item) {
                var menuitem;
                if (item) {
                    if (!this[item.id]) {
                        return;
                    }
                    menuitem = jQuery('<li/>', {
                        'role': 'presentation'
                    });
                    var link = jQuery('<a/>', {
                        'id': item.id,
                        'role': 'menuitem',
                        'href': '#',
                        'tabindex': -1
                    }).append(Sao.common.ICONFACTORY.get_icon_img(item.icon, {
                        'aria-hidden': 'true',
                    })).append(' ' + item.label).appendTo(menuitem);
                    this.menu_buttons[item.id] = menuitem;
                    link.click(function(evt) {
                        evt.preventDefault();
                        this[item.id]();
                    }.bind(this));
                } else if (!item && previous) {
                    menuitem = jQuery('<li/>', {
                        'role': 'separator',
                        'class': 'divider hidden-xs',
                    });
                } else {
                    return;
                }
                previous = menuitem;
                menuitem.appendTo(menu);
            }.bind(this));
        },
        create_toolbar: function() {
            var toolbar = jQuery('<nav/>', {
                'class': 'toolbar navbar navbar-default',
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
            }).append('&times;')).click(function() {
                this.close();
            }.bind(this)))).append(jQuery('<div/>', {
                'class': 'btn-toolbar navbar-right flip',
                'role': 'toolbar'
            })));
            this.set_menu(toolbar.find('ul[role*="menu"]'));

            var group;
            var add_button = function(item) {
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
                this.buttons[item.id].click(item, function(event) {
                    var item = event.data;
                    var button = this.buttons[item.id];
                    button.prop('disabled', true);
                    (this[item.id](this) || jQuery.when())
                        .always(function() {
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
                .addClass( 'hidden-xs')
                .find('.dropdown')
                .on('show.bs.dropdown', function() {
                    jQuery(this).parents('.btn-group')
                        .removeClass( 'hidden-xs');
                })
                .on('hide.bs.dropdown', function() {
                    jQuery(this).parents('.btn-group')
                        .addClass('hidden-xs');
                });
            return toolbar;
        },
        show: function() {
            jQuery('#tablist').find('a[href="#' + this.id + '"]').tab('show');
        },
        close: function() {
            var tabs = jQuery('#tabs');
            var tablist = jQuery('#tablist');
            var tab = tablist.find('#nav-' + this.id);
            var content = tabs.find('#' + this.id);
            this.show();
            return this._close_allowed().then(function() {
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
            }.bind(this));
        },
        _close_allowed: function() {
            return jQuery.when();
        },
        set_name: function(name) {
            this.name = name;
            this.name_el.text(Sao.common.ellipsize(name, 20));
            this.name_el.parents('li').first().attr('title', name);
        },
        get_url: function() {
        },
        compare: function(attributes) {
            return false;
        },
    });

    Sao.Tab.counter = 0;
    Sao.Tab.tabs = [];
    Sao.Tab.tabs.close = function(warning) {
        if (warning && Sao.Tab.tabs.length) {
            return Sao.common.sur.run(
                    Sao.i18n.gettext(
                        'The following action requires to close all tabs.\n' +
                        'Do you want to continue?')).then(function() {
                return Sao.Tab.tabs.close(false);
            });
        }
        if (Sao.Tab.tabs.length) {
            var tab = Sao.Tab.tabs[0];
            return tab.close().then(function() {
                if (!~Sao.Tab.tabs.indexOf(tab)) {
                    return Sao.Tab.tabs.close();
                } else {
                    return jQuery.Deferred().reject();
                }
            });
        }
        if (Sao.main_menu_screen) {
            return Sao.main_menu_screen.save_tree_state().then(function() {
                Sao.main_menu_screen = null;
            });
        }
        return jQuery.when();
    };
    Sao.Tab.tabs.get_current = function() {
        return jQuery('#tablist').find('li.active').data('tab');
    };
    Sao.Tab.tabs.close_current = function() {
        var tab = this.get_current();
        tab.close();
    };

    Sao.Tab.create = function(attributes) {
        var tablist = jQuery('#tablist');
        if (attributes.context === undefined) {
            attributes.context = {};
        }
        for (var i = 0; i < Sao.Tab.tabs.length; i++) {
            var other = Sao.Tab.tabs[i];
            if (other.compare(attributes)) {
                tablist.find('a[href="#' + other.id + '"]').tab('show');
                return;
            }
        }
        var tab;
        if (attributes.model) {
            tab = new Sao.Tab.Form(attributes.model, attributes);
        } else {
            tab = new Sao.Tab.Board(attributes);
        }
        tab.view_prm.done(function() {
            Sao.Tab.add(tab);
        });
    };

    Sao.Tab.add = function(tab) {
        var tabs = jQuery('#tabs');
        var tablist = jQuery('#tablist');
        var tabcontent = jQuery('#tabcontent');
        var tab_link = jQuery('<a/>', {
            'aria-controls': tab.id,
            'role': 'tab',
            'data-toggle': 'tab',
            'href': '#' + tab.id
        }).on('show.bs.tab', function() {
            Sao.set_url(tab.get_url(), tab.name);
        })
        .append(jQuery('<button/>', {
            'class': 'close'
        }).append(jQuery('<span/>', {
            'aria-hidden': true
        }).append('&times;')).append(jQuery('<span/>', {
            'class': 'sr-only'
        }).append(Sao.i18n.gettext('Close'))).click(function(evt) {
            evt.preventDefault();
            tab.close();
        }))
        .append(tab.name_el);
        jQuery('<li/>', {
            'role': 'presentation',
            'data-placement': 'bottom',
            id: 'nav-' + tab.id
        }).append(tab_link)
        .appendTo(tablist)
        .data('tab', tab);
        jQuery('<div/>', {
            role: 'tabpanel',
            'class': 'tab-pane',
            id: tab.id
        }).html(tab.el)
        .appendTo(tabcontent);
        tab_link.tab('show');
        tabs.trigger('ready');
    };

    Sao.Tab.previous_tab = function() {
        Sao.Tab.move('prevAll');
    };

    Sao.Tab.next_tab = function() {
        Sao.Tab.move('nextAll');
    };

    Sao.Tab.move = function(direction) {
        var current_tab = this.tabs.get_current();
        var tabs = jQuery('#tabs');
        var tablist = jQuery('#tablist');
        var tab = tablist.find('#nav-' + current_tab.id);
        var next = tab[direction]('li').first();
        if (!next.length) {
            if (direction == 'prevAll') {
                next = tablist.find('li').last();
            } else {
                next = tablist.find('li').first();
            }
        }
        if (next) {
            next.find('a').tab('show');
            tabs.trigger('ready');
        }
    };

    Sao.Tab.Form = Sao.class_(Sao.Tab, {
        class_: 'tab-form',
        init: function(model_name, attributes) {
            Sao.Tab.Form._super.init.call(this, attributes);
            var screen = new Sao.Screen(model_name, attributes);
            screen.tab = this;
            this.screen = screen;
            this.info_bar = new Sao.Window.InfoBar();
            this.create_tabcontent();

            screen.message_callback = this.record_message.bind(this);
            screen.switch_callback = function() {
                if (this === Sao.Tab.tabs.get_current()) {
                    Sao.set_url(this.get_url(), this.name);
                }
            }.bind(this);

            this.set_buttons_sensitive();

            this.view_prm = this.screen.switch_view().done(function() {
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
                    if (~['tree', 'graph', 'calendar'].indexOf(
                            screen.current_view.view_type)) {
                        screen.search_filter();
                    }
                }
                this.update_revision();
            }.bind(this));
        },
        create_toolbar: function() {
            var toolbar = Sao.Tab.Form._super.create_toolbar.call(this);
            var screen = this.screen;
            var buttons = this.buttons;
            var prm = screen.model.execute('view_toolbar_get', [],
                screen.context);
            prm.done(function(toolbars) {
                [
                ['action', 'tryton-launch',
                    Sao.i18n.gettext('Launch action')],
                ['relate', 'tryton-link',
                     Sao.i18n.gettext('Open related records')],
                ['print', 'tryton-print',
                     Sao.i18n.gettext('Print report')]
                ].forEach(function(menu_action) {
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
                        .on('show.bs.dropdown', function() {
                            jQuery(this).parents('.btn-group').removeClass(
                                    'hidden-xs');
                        }).on('hide.bs.dropdown', function() {
                            jQuery(this).parents('.btn-group').addClass(
                                    'hidden-xs');
                        });
                    var menu = button.find('.dropdown-menu');
                    button.click(function() {
                        menu.find([
                            '.' + menu_action[0] + '_button',
                            '.divider-button',
                            '.' + menu_action[0] + '_plugin',
                            '.divider-plugin'].join(',')).remove();
                        var buttons = screen.get_buttons().filter(
                            function(button) {
                                return menu_action[0] == (
                                    button.attributes.keyword || 'action');
                            });
                        if (buttons.length) {
                            menu.append(jQuery('<li/>', {
                                'role': 'separator',
                                'class': 'divider divider-button',
                            }));
                        }
                        buttons.forEach(function(button) {
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
                            .click(function(evt) {
                                evt.preventDefault();
                                screen.button(button.attributes);
                            })
                        .appendTo(menu);
                        });

                        var kw_plugins = [];
                        Sao.Plugins.forEach(function(plugin) {
                            plugin.get_plugins(screen.model.name).forEach(
                                function(spec) {
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
                        kw_plugins.forEach(function(plugin) {
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
                            .click(function(evt) {
                                evt.preventDefault();
                                var ids = screen.current_view.selected_records
                                    .map(function(record) {
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

                    toolbars[menu_action[0]].forEach(function(action) {
                        var item = jQuery('<li/>', {
                            'role': 'presentation'
                        })
                        .append(jQuery('<a/>', {
                            'role': 'menuitem',
                            'href': '#',
                            'tabindex': -1
                        }).append(action.name))
                        .click(function(evt) {
                            evt.preventDefault();
                            var prm = jQuery.when();
                            if (this.screen.modified()) {
                                prm = this.save();
                            }
                            prm.then(function() {
                                var exec_action = jQuery.extend({}, action);
                                var record_id = null;
                                if (screen.current_record) {
                                    record_id = screen.current_record.id;
                                }
                                var record_ids = screen.current_view
                                .selected_records.map(function(record) {
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
                                    jQuery.extend({}, screen.local_context));
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
                        toolbars.exports.forEach(function(export_) {
                            var item = jQuery('<li/>', {
                                'role': 'presentation',
                            })
                            .append(jQuery('<a/>', {
                                'role': 'menuitem',
                                'href': '#',
                                'tabindex': -1,
                            }).append(export_.name))
                            .click(function(evt) {
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
        },
        compare: function(attributes) {
            if (!attributes) {
                return false;
            }
            var compare = Sao.common.compare;
            return ((this.screen.model_name === attributes.model) &&
                (this.attributes.res_id === attributes.res_id) &&
                (compare(
                    this.attributes.domain || [], attributes.domain || [])) &&
                (compare(
                    this.attributes.mode || [], attributes.mode || [])) &&
                (compare(
                    this.attributes.view_ids || [],
                    attributes.view_ids || [])) &&
                (JSON.stringify(this.attributes.context) ===
                    JSON.stringify(attributes.context)) &&
                (this.attributes.limit == attributes.limit) &&
                (compare(
                    this.attributes.search_value || [],
                    attributes.search_value || []))
            );
        },
        _close_allowed: function() {
            return this.modified_save();
        },
        modified_save: function() {
            this.screen.save_tree_state();
            this.screen.current_view.set_value();
            if (this.screen.modified()) {
                return Sao.common.sur_3b.run(
                        Sao.i18n.gettext('This record has been modified\n' +
                            'do you want to save it?'))
                    .then(function(result) {
                        switch(result) {
                            case 'ok':
                                return this.save();
                            case 'ko':
                                return this.reload(false);
                            default:
                                return jQuery.Deferred().reject();
                        }
                    }.bind(this));
            }
            return jQuery.when();
        },
        new_: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name).create) {
                return jQuery.when();
            }
            return this.modified_save().then(function() {
                return this.screen.new_().then(function() {
                    this.info_bar.message();
                }.bind(this));
                // TODO activate_save
            }.bind(this));
        },
        save: function(tab) {
            if (tab) {
                // Called from button so we must save the tree state
                this.screen.save_tree_state();
            }
            var access = Sao.common.MODELACCESS.get(this.screen.model_name);
            if (!(access.write || access.create)) {
                return jQuery.Deferred().reject();
            }
            return this.screen.save_current().then(
                    function() {
                        this.info_bar.message(
                                Sao.i18n.gettext('Record saved.'), 'info');
                        this.screen.count_tab_domain();
                    }.bind(this),
                    function() {
                        this.info_bar.message(
                            this.screen.invalid_message(), 'danger');
                        return jQuery.Deferred().reject();
                    }.bind(this));
        },
        switch_: function() {
            return this.modified_save().done(function() {
                this.screen.switch_view();
            }.bind(this));
        },
        reload: function(test_modified) {
            if (test_modified === undefined) {
                test_modified = true;
            }
            var reload = function() {
                return this.screen.cancel_current().then(function() {
                    var set_cursor = false;
                    var record_id = null;
                    if (this.screen.current_record) {
                        record_id = this.screen.current_record.id;
                    }
                    if (this.screen.current_view.view_type != 'form') {
                        return this.screen.search_filter(
                            this.screen.screen_container.search_entry.val())
                            .then(function() {
                                this.screen.group.forEach(function(record) {
                                    if (record.id == record_id) {
                                        this.screen.current_record = record;
                                        set_cursor = true;
                                    }
                                }.bind(this));
                                return set_cursor;
                            }.bind(this));
                    }
                    return set_cursor;
                }.bind(this))
                .then(function(set_cursor) {
                    return this.screen.display(set_cursor).then(function() {
                        this.info_bar.message();
                        // TODO activate_save
                        this.screen.count_tab_domain();
                    }.bind(this));
                }.bind(this));
            }.bind(this);
            if (test_modified) {
                return this.modified_save().then(reload);
            } else {
                this.screen.save_tree_state(false);
                return reload();
            }
        },
        copy: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name).create) {
                return jQuery.when();
            }
            return this.modified_save().then(function() {
                return this.screen.copy().then(function() {
                    this.info_bar.message(
                            Sao.i18n.gettext(
                                'Working now on the duplicated record(s).'),
                            'info');
                    this.screen.count_tab_domain();
                }.bind(this));
            }.bind(this));
        },
        delete_: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name)['delete']) {
                return jQuery.when();
            }
            var msg;
            if (this.screen.current_view.view_type == 'form') {
                msg = Sao.i18n.gettext('Are you sure to remove this record?');
            } else {
                msg = Sao.i18n.gettext('Are you sure to remove those records?');
            }
            return Sao.common.sur.run(msg).then(function() {
                return this.screen.remove(true, false, true).then(
                        function() {
                            this.info_bar.message(
                                    Sao.i18n.gettext('Records removed.'),
                                    'info');
                            this.screen.count_tab_domain();
                        }.bind(this), function() {
                            this.info_bar.message(
                                    Sao.i18n.gettext('Records not removed.'),
                                    'danger');
                        }.bind(this));
            }.bind(this));
        },
        previous: function() {
            return this.modified_save().then(function() {
                this.screen.display_previous();
                this.info_bar.message();
                // TODO activate_save
            }.bind(this));
        },
        next: function() {
            return this.modified_save().then(function() {
                this.screen.display_next();
                this.info_bar.message();
                // TODO activate_save
            }.bind(this));
        },
        search: function() {
            var search_entry = this.screen.screen_container.search_entry;
            if (search_entry.is(':visible')) {
                window.setTimeout(function() {
                    search_entry.focus();
                }, 0);
            }
            return jQuery.when();
        },
        logs: function() {
            var record = this.screen.current_record;
            if ((!record) || (record.id < 0)) {
                this.info_bar.message(
                        Sao.i18n.gettext('You have to select one record.'),
                        'info');
                return jQuery.when();
            }
            var fields = [
                ['id', Sao.i18n.gettext('ID:')],
                ['create_uid.rec_name',
                    Sao.i18n.gettext('Creation User:')],
                ['create_date', Sao.i18n.gettext('Creation Date:')],
                ['write_uid.rec_name',
                    Sao.i18n.gettext('Latest Modification by:')],
                ['write_date', Sao.i18n.gettext('Latest Modification Date:')]
                ];

            return this.screen.model.execute('read', [[record.id],
                    fields.map(function(field) {
                        return field[0];
                    })], this.screen.context)
            .then(function(data) {
                data = data[0];
                var message = '';
                fields.forEach(function(field) {
                    var key = field[0];
                    var label = field[1];
                    var value = data;
                    var keys = key.split('.');
                    var name = keys.splice(-1);
                    keys.forEach(function(key) {
                        value = value[key + '.'] || {};
                    });
                    value = (value || {})[name] || '/';
                    if (value && value.isDateTime) {
                        value = Sao.common.format_datetime(
                            Sao.common.date_format(),
                            '%H:%M:%S',
                            value);
                    }
                    message += label + ' ' + value + '\n';
                });
                message += Sao.i18n.gettext('Model: ') + this.screen.model.name;
                Sao.common.message.run(message);
            }.bind(this));
        },
        revision: function() {
            var current_id = null;
            if (this.screen.current_record) {
                current_id = this.screen.current_record.id;
            }
            var set_revision = function(revisions) {
                return function(revision) {
                    if (revision) {
                        // Add a millisecond as microseconds are truncated
                        revision.add(1, 'milliseconds');
                    }
                    if ((this.screen.current_view.view_type == 'form') &&
                            (revision < revisions[revisions.length - 1][0])) {
                        revision = revisions[revisions.length - 1][0];
                    }
                    if (revision != this.screen.context._datetime) {
                        this.screen.clear();
                        // Update group context that will be propagated by
                        // recreating new group
                        this.screen.group._context._datetime = revision;
                        if (this.screen.current_view.view_type != 'form') {
                            this.screen.search_filter(
                                    this.screen.screen_container
                                    .search_entry.val());
                        } else {
                            this.screen.group.load([current_id]);
                        }
                        this.screen.display(true);
                        this.update_revision();
                    }
                }.bind(this);
            }.bind(this);
            return this.modified_save().then(function() {
                var ids = this.screen.current_view.selected_records.map(
                    function(record) {
                        return record.id;
                    });
                return this.screen.model.execute('history_revisions',
                    [ids], this.screen.context)
                    .then(function(revisions) {
                        new Sao.Window.Revision(revisions, set_revision(revisions));
                    });
            }.bind(this));
        },
        update_revision: function() {
            var revision = this.screen.context._datetime;
            var label, title;
            if (revision) {
                var date_format = Sao.common.date_format();
                var time_format = '%H:%M:%S.%f';
                var revision_label = ' @ ' + Sao.common.format_datetime(
                    date_format, time_format, revision);
                label = Sao.common.ellipsize(
                    this.name, 80 - revision_label.length) + revision_label;
                title = this.name + revision_label;
            } else {
                label = Sao.common.ellipsize(this.name, 80);
                title = this.name;
            }
            this.title.text(label);
            this.title.attr('title', title);
            this.set_buttons_sensitive(revision);
        },
        set_buttons_sensitive: function(revision) {
            if (!revision) {
                var access = Sao.common.MODELACCESS.get(this.screen.model_name);
                [['new_', access.create],
                ['save', access.create || access.write],
                ['delete_', access.delete],
                ['copy', access.create],
                ['import', access.create],
                ].forEach(function(e) {
                    var button = e[0];
                    var access = e[1];
                    if (this.buttons[button]) {
                        this.buttons[button].toggleClass('disabled', !access);
                    }
                    if (this.menu_buttons[name]) {
                        this.menu_buttons[name]
                            .toggleClass('disabled', !access);
                    }
                }.bind(this));
            } else {
                ['new_', 'save', 'delete_', 'copy', 'import'].forEach(
                    function(name) {
                        if (this.buttons[name]) {
                            this.buttons[name].addClass('disabled');
                        }
                        if (this.menu_buttons[name]) {
                            this.menu_buttons[name].addClass('disabled');
                        }
                    }.bind(this));
            }
        },
        attach: function(evt) {
            var window_ = function() {
                return new Sao.Window.Attachment(record, function() {
                    this.refresh_resources(true);
                }.bind(this));
            }.bind(this);
            var dropdown = this.buttons.attach.parents('.dropdown');
            if (!evt) {
                window.setTimeout(function() {
                    this.buttons.attach.click();
                }.bind(this));
                return;
            }
            var record = this.screen.current_record;
            var menu = dropdown.find('.dropdown-menu');
            menu.children().remove();
            Sao.Window.Attachment.get_attachments(record)
                .then(function(attachments) {
                    attachments.forEach(function(value) {
                        var name = value[0],
                            callback = value[1];
                        var link = jQuery('<a/>', {
                            'role': 'menuitem',
                            'href': '#',
                            'tabindex': -1,
                        }).append(name).appendTo(jQuery('<li/>', {
                            'role': 'presentation',
                        }).appendTo(menu));
                        if (typeof callback == 'string') {
                            link.attr('href', callback);
                            link.attr('target', '_new');
                        } else {
                            link.click(function(evt) {
                                evt.preventDefault();
                                callback();
                            });
                        }
                    });
                }).always(function() {
                    menu.append(jQuery('<li/>', {
                        'class': 'divider',
                    }));
                    menu.append(jQuery('<li/>', {
                        'role': 'presentation',
                        'class': 'input-file',
                    }).append(jQuery('<input/>', {
                        'type': 'file',
                        'role': 'menuitem',
                        'multiple': true,
                        'tabindex': -1,
                    }).change(function() {
                        var attachment = window_();
                        Sao.common.get_input_data(
                            jQuery(this), function(data, filename) {
                                attachment.add_data(data, filename);
                            });
                    })).append(jQuery('<a/>', {
                        'role': 'menuitem',
                        'href': '#',
                        'tabindex': -1,
                    }).append(Sao.i18n.gettext('Add...'))));
                    menu.append(jQuery('<li/>', {
                        'role': 'presentation',
                    }).append(jQuery('<a/>', {
                        'role': 'menuitem',
                        'href': '#',
                        'tabindex': -1,
                    }).append(Sao.i18n.gettext('Manage...'))
                        .click(function(evt) {
                            evt.preventDefault();
                            window_();
                        })));
                });
        },
        attach_drop: function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            evt = evt.originalEvent;
            var record = this.screen.current_record;
            if (!record || record.id < 0) {
                return;
            }

            var i, file;
            var files = [],
                uris = [],
                texts = [];
            if (evt.dataTransfer.items) {
                console.log(evt.dataTransfer.items);
                for (i = 0; i < evt.dataTransfer.items.length; i++) {
                    var item = evt.dataTransfer.items[i];
                    if (item.kind == 'string') {
                        var list;
                        if (item.type == 'text/uri-list') {
                            list = uris;
                        } else if (item.type == 'text/plain') {
                            list = texts;
                        } else {
                            continue;
                        }
                        var prm = jQuery.Deferred();
                        evt.dataTransfer.items[i].getAsString(prm.resolve);
                        list.push(prm);
                        break;
                    } else {
                        file = evt.dataTransfer.items[i].getAsFile();
                        if (file) {
                            files.push(file);
                        }
                    }
                }
            } else {
                for (i = 0; i < evt.dataTransfer.files.length; i++) {
                    file = evt.dataTransfer.files[i];
                    if (file) {
                        files.push(file);
                    }
                }
            }

            var window_ = new Sao.Window.Attachment(record, function() {
                this.refresh_resources(true);
            }.bind(this));
            files.forEach(function(file) {
                Sao.common.get_file_data(file, function(data, filename) {
                    window_.add_data(data, filename);
                });
            });
            jQuery.when.apply(jQuery, uris).then(function() {
                function empty(value) {
                    return Boolean(value);
                }
                for (var i = 0; i < arguments.length; i++) {
                    arguments[i].split('\r\n')
                        .filter(empty)
                        .forEach(window_.add_uri, window_);
                }
            });
            jQuery.when.apply(jQuery, texts).then(function() {
                for (var i = 0; i < arguments.length; i++) {
                    window_.add_text(arguments[i]);
                }
            });
            if (evt.dataTransfer.items) {
                evt.dataTransfer.items.clear();
            } else {
                evt.dataTransfer.clearData();
            }
        },
        note: function() {
            var record = this.screen.current_record;
            if (!record || (record.id < 0)) {
                return;
            }
            new Sao.Window.Note(record, function() {
                this.refresh_resources(true);
            }.bind(this));
        },
        refresh_resources: function(reload) {
            var record = this.screen.current_record;
            if (record) {
                record.get_resources(reload).always(
                    this.update_resources.bind(this));
            } else {
                this.update_resources();
            }
        },
        update_resources: function(resources) {
            if (!resources) {
                resources = {};
            }
            var record_id = this.screen.get_id();
            var disabled = record_id < 0 || record_id === null;

            var update = function(name, title, text, color) {
                var button = this.buttons[name];

                var badge = button.find('.badge');
                if (!badge.length) {
                    badge = jQuery('<span/>', {
                        'class': 'badge'
                    }).appendTo(button);
                }
                if (color) {
                    color = Sao.config.icon_colors[color];
                } else {
                    color = '';
                }
                badge.css('background-color', color);
                badge.text(text);
                button.attr('title', title);
                button.prop('disabled', disabled);
            }.bind(this);

            var count = resources.attachment_count || 0;
            var badge = count || '';
            if (count > 99) {
                badge = '99+';
            }
            var title= Sao.i18n.gettext("Attachment (%1)", count);
            update('attach', title, badge, 1);

            count = resources.note_count || 0;
            var unread = resources.note_unread || 0;
            badge = '';
            var color = unread > 0 ? 2 : 1;
            if (count) {
                if (count > 9) {
                    badge = '+';
                } else {
                    badge = count;
                }
                if (unread > 9) {
                    badge = '+/' + badge;
                } else {
                    badge = unread + '/' + badge;
                }
            }
            title = Sao.i18n.gettext("Note (%1/%2)", unread, count);
            update('note', title, badge, color);
        },
        record_message: function(data) {
            if (data) {
                var name = "_";
                if (data[0] !== 0) {
                    name = data[0];
                }
                var buttons = ['print', 'relate', 'attach'];
                buttons.forEach(function(button_id){
                    var button = this.buttons[button_id];
                    if (button) {
                        var disabled = button.is(':disabled');
                        button.prop('disabled', disabled || data[0] === 0);
                    }
                }.bind(this));
                this.buttons.switch_.prop('disabled',
                    this.attributes.view_ids > 1);
                var msg = name + ' / ' + data[1];
                if (data[1] < data[2]) {
                    msg += Sao.i18n.gettext(' of ') + data[2];
                }
                this.status_label.text(msg).attr('title', msg);
            }
            this.info_bar.message();
            // TODO activate_save
        },
        action: function() {
            window.setTimeout(function() {
                this.buttons.action.find('button').click();
            }.bind(this));
        },
        relate: function() {
            window.setTimeout(function() {
                this.buttons.relate.find('button').click();
            }.bind(this));
        },
        print: function() {
            window.setTimeout(function() {
                this.buttons.print.find('button').click();
            }.bind(this));
        },
        export: function(){
            this.modified_save().then(function() {
                new Sao.Window.Export(
                    this.title.text(), this.screen,
                    this.screen.current_view.selected_records.map(function(r) {
                        return r.id;
                    }),
                    this.screen.current_view.get_fields(),
                    this.screen.context);
            }.bind(this));
        },
        do_export: function(export_) {
            this.modified_save().then(function() {
                var ids = this.screen.current_view.selected_records
                    .map(function(r) {
                        return r.id;
                    });
                var fields = export_['export_fields.'].map(function(field) {
                    return field.name;
                });
                this.screen.model.execute(
                    'export_data', [ids, fields], this.screen.context)
                    .then(function(data) {
                        var unparse_obj = {
                            'fields': fields,
                            'data': data,
                        };
                        var delimiter = ',';
                        var encoding = 'utf-8';
                        if (navigator.platform &&
                            navigator.platform.slice(0, 3) == 'Win') {
                            delimiter = ';';
                            encoding = 'cp1252';
                        }
                        var csv = Papa.unparse(unparse_obj, {
                            quoteChar: '"',
                            delimiter: delimiter,
                        });
                        Sao.common.download_file(
                            csv, export_.name + '.csv',
                            {'type': 'text/csv;charset=' + encoding});
                    });
            }.bind(this));
        },
        import: function(){
            new Sao.Window.Import(this.title.text(), this.screen);
        },
        get_url: function() {
            return this.screen.get_url(this.attributes.name);
        },
    });

    Sao.Tab.Board = Sao.class_(Sao.Tab, {
        class_: 'tab-board',
        init: function(attributes) {
            var UIView, view_prm;
            Sao.Tab.Board._super.init.call(this, attributes);
            this.model = attributes.model;
            this.view_id = (attributes.view_ids.length > 0 ?
                    attributes.view_ids[0] : null);
            this.context = attributes.context;
            this.name = attributes.name || '';
            this.dialogs = [];
            this.board = null;
            UIView = new Sao.Model('ir.ui.view');
            this.view_prm = UIView.execute('read', [[this.view_id], ['arch']],
                    this.context);
            this.view_prm.done(function(views) {
                var view, board;
                view = jQuery(jQuery.parseXML(views[0].arch));
                this.board = new Sao.View.Board(view, this.context);
                this.board.actions_prms.done(function() {
                    var i, len, action;
                    for (i = 0, len = this.board.actions.length; i < len; i++) {
                        action = this.board.actions[i];
                        action.screen.tab = this;
                    }
                }.bind(this));
                this.el.append(this.board.el);
            }.bind(this));
            this.create_tabcontent();
            this.set_name(this.name);
            this.title.html(this.name_el.text());
        },
        compare: function(attributes) {
            if (!attributes) {
                return false;
            }
            var compare = Sao.common.compare;
            return ((this.model === attributes.model) &&
                (compare(
                    this.attributes.view_ids || [], attributes.view_ids || [])) &&
                (JSON.stringify(this.context) === JSON.stringify(attributes.context))
            );
        },
        reload: function() {
            this.board.reload();
        },
        record_message: function() {
            var i, len;
            var action;

            len = this.board.actions.length;
            for (i = 0, len=len; i < len; i++) {
                action = this.board.actions[i];
                action.update_domain(this.board.actions);
            }
        },
        refresh_resources: function() {
        },
        update_resources: function() {
        },
    });

    Sao.Tab.Wizard = Sao.class_(Sao.Tab, {
        class_: 'tab-wizard',
        init: function(wizard) {
            Sao.Tab.Wizard._super.init.call(this);
            this.wizard = wizard;
            this.set_name(wizard.name);
            wizard.tab = this;
            this.create_tabcontent();
            this.title.html(this.name_el.text());
            this.el.append(wizard.form);
        },
        create_toolbar: function() {
            return jQuery('<span/>');
        },
        _close_allowed: function() {
            var wizard = this.wizard;
            var prm = jQuery.when();
            if ((wizard.state !== wizard.end_state) &&
                (wizard.end_state in wizard.states)) {
                prm = wizard.response(wizard.end_state);
            }
            var dfd = jQuery.Deferred();
            prm.always(function() {
                if (wizard.state === wizard.end_state) {
                    dfd.resolve();
                } else {
                    dfd.reject();
                }
            });
            return dfd.promise();
        }
    });
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.ScreenContainer = Sao.class_(Object, {
        init: function(tab_domain) {
            this.alternate_viewport = jQuery('<div/>', {
                'class': 'screen-container'
            });
            this.alternate_view = false;
            this.search_modal = null;
            this.search_form = null;
            this.last_search_text = '';
            this.tab_domain = tab_domain || [];
            this.tab_counter = [];
            this.el = jQuery('<div/>', {
                'class': 'screen-container'
            });
            this.filter_box = jQuery('<form/>', {
                'class': 'filter-box'
            }).submit(function(e) {
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
            but_clear.click(function() {
                this.search_entry.val('').change();
                this.do_search();
            }.bind(this));

            this.search_entry.on('keyup change', function() {
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
            this.but_bookmark.click(function() {
                dropdown_bookmark.children().remove();
                var bookmarks = this.bookmarks();
                for (var i=0; i < bookmarks.length; i++) {
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
                'class': 'col-sm-10 col-xs-12'
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
                'class': 'col-sm-2 pull-right'
            }).appendTo(search_row));

            this.content_box = jQuery('<div/>', {
                'class': 'content-box'
            });

            if (!jQuery.isEmptyObject(this.tab_domain)) {
                this.tab = jQuery('<div/>', {
                    'class': 'tab-domain'
                }).appendTo(this.el);
                var nav = jQuery('<ul/>', {
                    'class': 'nav nav-tabs',
                    role: 'tablist'
                }).appendTo(this.tab);
                var content = jQuery('<div/>', {
                    'class': 'tab-content'
                }).appendTo(this.tab);
                this.tab_domain.forEach(function(tab_domain, i) {
                    var name = tab_domain[0];
                    var counter = jQuery('<span/>', {
                        'class': 'badge'
                    });
                    var page = jQuery('<li/>', {
                        role: 'presentation',
                        id: 'nav-' + i
                    }).append(jQuery('<a/>', {
                        'aria-controls':  i,
                        role: 'tab',
                        'data-toggle': 'tab',
                        'href': '#' + i
                    }).append(name + ' ').append(counter)).appendTo(nav);
                    this.tab_counter.push(counter);
                }.bind(this));
                nav.find('a:first').tab('show');
                var self = this;
                nav.find('a').click(function(e) {
                    e.preventDefault();
                    jQuery(this).tab('show');
                    self.do_search();
                    self.screen.count_tab_domain();
                });
            } else {
                this.tab = null;
            }
            this.el.append(this.content_box);
        },
        set_text: function(value) {
            this.search_entry.val(value);
            this.bookmark_match();
        },
        update: function() {
            var completions = this.screen.domain_parser.completion(
                    this.get_text());
            this.search_list.children().remove();
            completions.forEach(function(e) {
                jQuery('<option/>', {
                    'value': e.trim()
                }).appendTo(this.search_list);
            }, this);
        },
        set_star: function(star) {
            var img = this.but_star.children('img');
            var title, icon;
            if (star) {
                icon = 'tryton-star';
                title = Sao.i18n.gettext("Remove this bookmark");
            } else {
                icon = 'tryton-star-border';
                title = Sao.i18n.gettext('Bookmark this filter');
            }
            this.but_star.data('star', Boolean(star));
            this.but_star.attr('title', title);
            this.but_star.attr('aria-label', title);
            Sao.common.ICONFACTORY.get_icon_url(icon).then(function(url) {
                img.attr('src', url);
            });
        },
        get_star: function() {
            return this.but_star.data('star');
        },
        star_click: function() {
            var star = this.get_star();
            var model_name = this.screen.model_name;
            var refresh = function() {
                this.bookmark_match();
                this.but_bookmark.prop('disabled',
                        jQuery.isEmptyObject(this.bookmarks()));
            }.bind(this);
            if (!star) {
                var text = this.get_text();
                if (!text) {
                    return;
                }
                Sao.common.ask.run(Sao.i18n.gettext('Bookmark Name:'))
                    .then(function(name) {
                        if (!name) {
                            return;
                        }
                        var domain = this.screen.domain_parser.parse(text);
                        Sao.common.VIEW_SEARCH.add(model_name, name, domain)
                        .then(function() {
                            refresh();
                        });
                        this.set_text(
                            this.screen.domain_parser.string(domain));
                    }.bind(this));
            } else {
                var id = this.bookmark_match();
                Sao.common.VIEW_SEARCH.remove(model_name, id).then(function() {
                    refresh();
                });
            }
        },
        bookmarks: function() {
            var searches = Sao.common.VIEW_SEARCH.get(this.screen.model_name);
            return searches.filter(function(search) {
                return this.screen.domain_parser.stringable(search[2]);
            }.bind(this));
        },
        bookmark_activate: function(e) {
            e.preventDefault();
            var domain = e.data;
            this.set_text(this.screen.domain_parser.string(domain));
            this.do_search();
        },
        bookmark_match: function() {
            var current_text = this.get_text();
            if (current_text) {
                var current_domain = this.screen.domain_parser.parse(
                        current_text);
                this.but_star.prop('disabled', !current_text);
                var star = this.get_star();
                var bookmarks = this.bookmarks();
                for (var i=0; i < bookmarks.length; i++) {
                    var id = bookmarks[i][0];
                    var name = bookmarks[i][1];
                    var domain = bookmarks[i][2];
                    var text = this.screen.domain_parser.string(domain);
                    if ((text === current_text) ||
                            (Sao.common.compare(domain, current_domain))) {
                        this.set_star(true);
                        return id;
                    }
                }
            }
            this.set_star(false);
        },
        search_prev: function() {
            this.screen.search_prev(this.get_text());
        },
        search_next: function() {
            this.screen.search_next(this.get_text());
        },
        search_active: function() {
            this.but_active.toggleClass('active');
            this._set_active_tooltip();
            this.screen.search_filter(this.get_text());
        },
        _set_active_tooltip: function() {
            var tooltip;
            if (this.but_active.hasClass('active')) {
                tooltip = Sao.i18n.gettext('Show active records');
            } else {
                tooltip = Sao.i18n.gettext('Show inactive records');
            }
            this.but_active.attr('aria-label', tooltip);
            this.but_active.attr('title', tooltip);
        },
        get_tab_domain: function() {
            if (!this.tab) {
                return [];
            }
            var i = this.tab.find('li').index(this.tab.find('li.active'));
            return this.tab_domain[i][1];
        },
        set_tab_counter: function(count, idx) {
            if (jQuery.isEmptyObject(this.tab_counter) || !this.tab) {
                return;
            }
            if ((idx === undefined) || (idx === null)) {
                idx = this.tab.find('li').index(this.tab.find('li.active'));
            }
            if (idx < 0) {
                return;
            }
            var counter = this.tab_counter[idx];
            if (count === null) {
                counter.attr('title', '');
                counter.text('');
            } else {
                counter.attr('title', count);
                var text = count;
                if (count > 99) {
                    text = '99+';
                }
                counter.text(text);
            }
        },
        do_search: function() {
            return this.screen.search_filter(this.get_text());
        },
        set_screen: function(screen) {
            this.screen = screen;
            this.but_bookmark.prop('disabled',
                    jQuery.isEmptyObject(this.bookmarks()));
            this.bookmark_match();
        },
        show_filter: function() {
            this.filter_box.show();
            if (this.tab) {
                this.tab.show();
            }
        },
        hide_filter: function() {
            this.filter_box.hide();
            if (this.tab) {
                this.tab.hide();
            }
        },
        set: function(widget) {
            if (this.alternate_view) {
                this.alternate_viewport.children().detach();
                this.alternate_viewport.append(widget);
            } else {
                this.content_box.children().detach();
                this.content_box.append(widget);
            }
        },
        get_text: function() {
            return this.search_entry.val();
        },
        search_box: function() {
            var domain_parser = this.screen.domain_parser;
            var search = function() {
                this.search_modal.modal('hide');
                var text = '';
                var quote = domain_parser.quote.bind(domain_parser);
                for (var i = 0; i < this.search_form.fields.length; i++) {
                    var label = this.search_form.fields[i][0];
                    var entry = this.search_form.fields[i][1];
                    var value;
                    if ((entry instanceof Sao.ScreenContainer.Between) ||
                        (entry instanceof Sao.ScreenContainer.Selection)) {
                        value = entry.get_value(quote);
                    } else {
                        value = quote(entry.val());
                    }
                    if (value) {
                        text += quote(label) + ': ' + value + ' ';
                    }
                }
                this.set_text(text);
                this.do_search().then(function() {
                    this.last_search_text = this.get_text();
                }.bind(this));
            }.bind(this);
            if (!this.search_modal) {
                var dialog = new Sao.Dialog(
                        Sao.i18n.gettext('Filters'), '', 'lg');
                this.search_modal = dialog.modal;
                this.search_form = dialog.content;
                this.search_form.addClass('form-horizontal');
                this.search_form.submit(function(e) {
                    search();
                    e.preventDefault();
                });

                var fields = [];
                var field;
                for (var f in domain_parser.fields) {
                    field = domain_parser.fields[f];
                    if (field.searchable || field.searchable === undefined) {
                        fields.push(field);
                    }
                }

                var boolean_option = function(input) {
                    return function(e) {
                        jQuery('<option/>', {
                            value: e,
                            text: e
                        }).appendTo(input);
                    };
                };
                var selection_option = function(input) {
                    return function(s) {
                        jQuery('<option/>', {
                            value: s[1],
                            text: s[1]
                        }).appendTo(input);
                    };
                };

                var prefix = 'filter-' + this.screen.model_name + '-';
                this.search_form.fields = [];
                for (var i = 0; i < fields.length; i++) {
                    field = fields[i];
                    var form_group = jQuery('<div/>', {
                        'class': 'form-group form-group-sm'
                    }).append(jQuery('<label/>', {
                        'class': 'col-sm-4 control-label',
                        'for': prefix + field.name,
                        text: field.string
                    })).appendTo(dialog.body);

                    var input;
                    var entry;
                    switch (field.type) {
                        case 'boolean':
                            entry = input = jQuery('<select/>', {
                                'class': 'form-control input-sm',
                                id: prefix + field.name
                            });
                            ['',
                            Sao.i18n.gettext('True'),
                            Sao.i18n.gettext('False')].forEach(
                                    boolean_option(input));
                            break;
                        case 'selection':
                            entry = new Sao.ScreenContainer.Selection(
                                    field.selection, prefix + field.name);
                            input = entry.el;
                            break;
                        case 'date':
                        case 'datetime':
                        case 'time':
                            var format;
                            var date_format = Sao.common.date_format(
                                this.screen.context.date_format);
                            if (field.type == 'date') {
                                format = date_format;
                            } else {
                                var time_format = new Sao.PYSON.Decoder({}).decode(
                                        field.format);
                                time_format = Sao.common.moment_format(time_format);
                                if (field.type == 'time') {
                                    format = time_format;
                                } else if (field.type == 'datetime') {
                                    format = date_format + ' ' + time_format;
                                }
                            }
                            entry = new Sao.ScreenContainer.DateTimes(
                                    format, prefix + field.name);
                            input = entry.el;
                            break;
                        case 'integer':
                        case 'float':
                        case 'numeric':
                            entry = new Sao.ScreenContainer.Numbers(prefix + field.name);
                            input = entry.el;
                            break;
                        default:
                            entry = input = jQuery('<input/>', {
                                'class': 'form-control input-sm',
                                type: 'text',
                                placeholder: field.string,
                                id: prefix + field.name
                            });
                            break;
                    }
                    jQuery('<div/>', {
                        'class': 'col-sm-8'
                    }).append(input).appendTo(form_group);
                    this.search_form.fields.push([field.string, entry, input]);
                }

                jQuery('<button/>', {
                    'class': 'btn btn-primary',
                    type: 'submit'
                }).append(Sao.i18n.gettext('Find'))
                .click(search).appendTo(dialog.footer);
            }
            this.search_modal.modal('show');
            if (this.last_search_text.trim() !== this.get_text().trim()) {
                for (var j = 0; j < this.search_form.fields.length; j++) {
                    var fentry = this.search_form.fields[j][1];
                    switch(fentry.type) {
                        case 'selection':
                            fentry.set_value([]);
                            break;
                        case 'date':
                        case 'datetime':
                        case 'time':
                            fentry.set_value(null, null);
                            break;
                        default:
                            fentry.val('');
                    }
                }
                this.search_form.fields[0][2].focus();
            }
        }
    });

    Sao.ScreenContainer.Between = Sao.class_(Object, {
        init: function(id) {
            this.el = jQuery('<div/>', {
                'class': 'row',
                id: id
            });
            this.from = this.build_entry(Sao.i18n.gettext("From"),
                jQuery('<div/>', {
                    'class': 'col-md-5'
                }).appendTo(this.el));
            jQuery('<p/>', {
                'class': 'text-center'
            }).append('..').appendTo(jQuery('<div/>', {
                'class': 'col-md-1'
            }).appendTo(this.el));
            this.to = this.build_entry(Sao.i18n.gettext("To"),
                jQuery('<div/>', {
                    'class': 'col-md-5'
                }).appendTo(this.el));
        },
        build_entry: function(placeholder, el) {
        },
        get_value: function(quote) {
            var from = this._get_value(this.from);
            var to = this._get_value(this.to);
            if (from && to) {
                if (from !== to) {
                    return quote(from) + '..' + quote(to);
                } else {
                    return quote(from);
                }
            } else if (from) {
                return '>=' + quote(from);
            } else if (to) {
                return '<=' + quote(to);
            }
        },
        _get_value: function(entry) {
        },
        set_value: function(from, to) {
            this._set_value(self.from, from);
            this._set_value(self.to, to);
        },
        _set_value: function(entry, value) {
        },
        _from_changed: function(evt) {
            this._set_value(this.to, this._get_value(this.from));
        },
    });

    Sao.ScreenContainer.BetweenDates = Sao.class_(Sao.ScreenContainer.Between, {
        init: function(format, id) {
            this.format = format;
            Sao.ScreenContainer.BetweenDates._super.init.call(this, id);
            this.from.on('dp.change', this._from_changed.bind(this));
        },
        _get_value: function(entry, value) {
            return entry.find('input').val();
        },
        _set_value: function(entry, value) {
            entry.data('DateTimePicker').date(value);
        },
    });

    Sao.ScreenContainer.DateTimes = Sao.class_(
        Sao.ScreenContainer.BetweenDates, {
        build_entry: function(placeholder, el) {
                var entry = jQuery('<div/>', {
                    'class': 'input-group input-group-sm'
                }).appendTo(el);
                jQuery('<span/>', {
                    'class': 'input-group-btn'
                }).append(jQuery('<button/>', {
                    'class': 'datepickerbutton btn btn-default',
                    type: 'button',
                    'tabindex': -1,
                    'aria-label': Sao.i18n.gettext("Open the calendar"),
                    'title': Sao.i18n.gettext("Open the calendar"),
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-date')
                )).appendTo(entry);
                jQuery('<input/>', {
                    'class': 'form-control input-sm',
                    type: 'text',
                    placeholder: placeholder,
                }).appendTo(entry);
                entry.datetimepicker({
                    'locale': moment.locale(),
                    'keyBinds': null,
                });
                entry.data('DateTimePicker').format(this.format);
                // We must set the overflow of the modal-body
                // containing the input to visible to prevent vertical scrollbar
                // inherited from the auto overflow-x
                // (see http://www.w3.org/TR/css-overflow-3/#overflow-properties)
                entry.on('dp.hide', function() {
                    entry.closest('.modal-body').css('overflow', '');
                });
                entry.on('dp.show', function() {
                    entry.closest('.modal-body').css('overflow', 'visible');
                });

                var mousetrap = new Mousetrap(el[0]);

                mousetrap.bind('enter', function(e, combo) {
                    entry.data('DateTimePicker').date();
                });
                mousetrap.bind('=', function(e, combo) {
                    e.preventDefault();
                    entry.data('DateTimePicker').date(moment());
                });

                Sao.common.DATE_OPERATORS.forEach(function(operator) {
                    mousetrap.bind(operator[0], function(e, combo) {
                        e.preventDefault();
                        var dp = entry.data('DateTimePicker');
                        var date = dp.date();
                        date.add(operator[1]);
                        dp.date(date);
                    });
                });
                return entry;
        },
    });

    Sao.ScreenContainer.Numbers = Sao.class_(Sao.ScreenContainer.BetweenDates, {
        init: function(id) {
            Sao.ScreenContainer.Numbers._super.init.call(this, id);
            this.from.change(this._from_changed.bind(this));
        },
        build_entry: function(placeholder, el) {
            var entry = jQuery('<input/>', {
                'class': 'form-control input-sm',
                'type': 'number',
                'step': 'any',
            }).appendTo(el);
            return entry;
        },
        _get_value: function(entry, value) {
            return entry.val();
        },
        _set_value: function(entry, value) {
            return entry.val(value);
        },
    });

    Sao.ScreenContainer.Selection = Sao.class_(Object, {
        init: function(selections, id) {
            this.el = jQuery('<select/>', {
                'class': 'form-control input-sm',
                multiple: true,
                id: id
            });
            selections.forEach(function(s) {
                jQuery('<option/>', {
                    value: s[1],
                    text: s[1]
                }).appendTo(this.el);
            }.bind(this));
        },
        get_value: function(quote) {
            var value = this.el.val();
            if (!jQuery.isEmptyObject(value)) {
                value = jQuery.map(value, quote).reduce(function(a, b) {
                    if (a) {a += ';';}
                    return a + b;
                });
            } else {
                value = null;
            }
            return value;
        },
        set_value: function(value) {
            this.el.val(value);
        }
    });

    Sao.Screen = Sao.class_(Object, {
        init: function(model_name, attributes) {
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
                            'context': attributes.context });

                this.context_screen_prm = this.context_screen.switch_view()
                    .then(function() {
                        jQuery('<div/>', {
                            'class': 'row'
                        }).append(jQuery('<div/>', {
                            'class': 'col-md-12'
                        }).append(this.context_screen.screen_container.el))
                        .prependTo(this.screen_container.filter_box);
                        return this.context_screen.new_(false).then(function(record) {
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
            // count_tab_domain is called in Sao.Tab.Form.init after
            // switch_view to avoid unnecessary call to fields_view_get by
            // domain_parser.
        },
        load_next_view: function() {
            if (!jQuery.isEmptyObject(this.view_to_load)) {
                var view_id;
                if (!jQuery.isEmptyObject(this.view_ids)) {
                    view_id = this.view_ids.shift();
                }
                var view_type = this.view_to_load.shift();
                return this.add_view_id(view_id, view_type);
            }
            return jQuery.when();
        },
        add_view_id: function(view_id, view_type) {
            var view;
            if (view_id && this.views_preload[String(view_id)]) {
                view = this.views_preload[String(view_id)];
            } else if (!view_id && this.views_preload[view_type]) {
                view = this.views_preload[view_type];
            } else {
                var prm = this.model.execute('fields_view_get',
                        [view_id, view_type], this.context);
                return prm.pipe(this.add_view.bind(this));
            }
            this.add_view(view);
            return jQuery.when();
        },
        add_view: function(view) {
            var arch = view.arch;
            var fields = view.fields;
            var view_id = view.view_id;
            var xml_view = jQuery(jQuery.parseXML(arch));

            if (xml_view.children().prop('tagName') == 'tree') {
                this.fields_view_tree[view_id] = view;
            }

            var loading = 'eager';
            if (xml_view.children().prop('tagName') == 'form') {
                loading = 'lazy';
            }
            for (var field in fields) {
                if (!(field in this.model.fields) || loading == 'eager') {
                    fields[field].loading = loading;
                } else {
                    fields[field].loading = this.model.fields[field]
                        .description.loading;
                }
            }
            this.group.add_fields(fields);
            for (field in fields) {
                this.group.model.fields[field].views.add(view_id);
            }
            var view_widget = Sao.View.parse(
                this, view_id, view.type, xml_view, view.field_childs);
            this.views.push(view_widget);

            return view_widget;
        },
        get number_of_views() {
            return this.views.length + this.view_to_load.length;
        },
        switch_view: function(view_type, view_id) {
            if ((view_id !== undefined) && (view_id !== null)) {
                view_id = Number(view_id);
            } else {
                view_id = null;
            }
            if (this.current_view) {
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
                    return this.current_view.display().done(function() {
                        this.set_cursor();
                    }.bind(this));
                }
            }
            var found = function() {
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
            var _switch = function() {
                var set_container = function() {
                    this.screen_container.set(this.current_view.el);
                    return this.display().done(function() {
                        this.set_cursor();
                        if (this.switch_callback) {
                            this.switch_callback();
                        }
                    }.bind(this));
                }.bind(this);
                var continue_loop = function() {
                    if (!view_type && (view_id === null)) {
                        return false;
                    }
                    if (view_type && !view_id && !this.view_to_load.length) {
                        return false;
                    }
                    return true;
                }.bind(this);
                var set_current_view = function() {
                    this.current_view = this.views[this.views.length - 1];
                }.bind(this);
                var switch_current_view = (function() {
                    set_current_view();
                    if (continue_loop()) {
                        return _switch();
                    } else {
                        return set_container();
                    }
                }.bind(this));
                var is_view_id = function(view) {
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
        },
        search_filter: function(search_string, only_ids) {
            only_ids = only_ids || false;
            if (this.context_screen && !only_ids) {
                if (this.context_screen_prm.state() == 'pending') {
                    return this.context_screen_prm.then(function() {
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
                this.new_group(jQuery.extend(
                    this.local_context,
                    this.context_screen.get_on_change_value()));
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
            var search = function() {
                return this.model.execute(
                    'search', [domain, this.offset, this.limit, this.order],
                    context)
                    .then(function(ids) {
                        if (ids.length || this.offset <= 0) {
                            return ids;
                        } else {
                            this.offset = Math.max(this.offset - this.limit, 0);
                            return search();
                        }
                    }.bind(this));
            }.bind(this);
            return search().then(function(ids) {
                    var count_prm = jQuery.when(this.search_count);
                    if (!only_ids) {
                        if ((this.limit !== null) &&
                            (ids.length == this.limit)) {
                            count_prm = this.model.execute(
                                'search_count', [domain], context)
                                .then(function(count) {
                                    this.search_count = count;
                                    return this.search_count;
                                }.bind(this), function() {
                                    this.search_count = 0;
                                    return this.search_count;
                                }.bind(this));
                        } else {
                            this.search_count = ids.length;
                        }
                    }
                    return count_prm.then(function(count) {
                        this.screen_container.but_next.prop('disabled',
                            !(this.limit !== undefined &&
                                ids.length == this.limit &&
                                count > this.limit + this.offset));
                        this.screen_container.but_prev.prop('disabled', this.offset <= 0);
                        if (only_ids) {
                            return ids;
                        }
                        this.clear();
                        return this.load(ids).then(function() {
                            this.count_tab_domain();
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
        },
        search_domain: function(search_string, set_text) {
            set_text = set_text || false;
            var domain = [];

            // Test first parent to avoid calling unnecessary domain_parser
            if (!this.group.parent && this.domain_parser) {
                var domain_parser = this.domain_parser;
                if (search_string || search_string === '') {
                    domain = domain_parser.parse(search_string);
                } else {
                    domain = this.attributes.search_value;
                    this.attributes.search_value = null;
                }
                if (set_text) {
                    this.screen_container.set_text(
                            domain_parser.string(domain));
                }
            } else {
                domain = [['id', 'in', this.group.map(function(r) {
                    return r.id;
                })]];
            }

            if (!jQuery.isEmptyObject(domain)) {
                if (!jQuery.isEmptyObject(this.attributes.domain)) {
                    domain = ['AND', domain, this.attributes.domain];
                }
            } else {
                domain = this.attributes.domain || [];
            }
            if (this.screen_container.but_active.hasClass('active')) {
                if (!jQuery.isEmptyObject(domain)) {
                    domain = [domain, ['active', '=', false]];
                } else {
                    domain = [['active', '=', false]];
                }
            }
            if (this.current_view &&
                    this.current_view.view_type == 'calendar') {
                if (!jQuery.isEmptyObject(domain)) {
                   domain = ['AND', domain,
                        this.current_view.current_domain()];
                } else {
                    domain = this.current_view.current_domain();
                }
            }
            return domain;
        },
        count_tab_domain: function() {
            var screen_domain = this.search_domain(
                this.screen_container.get_text());
            this.screen_container.tab_domain.forEach(function(tab_domain, i) {
                if (tab_domain[2]) {
                    var domain = ['AND', tab_domain[1], screen_domain];
                    this.screen_container.set_tab_counter(null, i);
                    this.group.model.execute(
                        'search_count', [domain], this.context)
                        .then(function(count) {
                            this.screen_container.set_tab_counter(count, i);
                        }.bind(this));
                }
            }.bind(this));
        },
        get context() {
            var context = this.group.context;
            if ( this.context_screen ){
                context.context_model = this.context_screen.model_name;
            }
            return context;
        },
        get local_context() {
            var context = this.group.local_context;
            if (this.context_screen) {
                context.context_model = this.context_screen.model_name;
            }
            return context;
        },
        set_group: function(group) {
            var fields = {},
                fields_views = {},
                name;
            if (this.group) {
                for (name in this.group.model.fields) {
                    var field = this.group.model.fields[name];
                    fields[name] = field.description;
                    fields_views[name] = field.views;
                }
                this.group.screens.splice(
                        this.group.screens.indexOf(this), 1);
                jQuery.extend(group.on_write, this.group.on_write);
                group.on_write = group.on_write.filter(function(e, i, a) {
                    return i == a.indexOf(e);
                });
                if (this.group.parent && !group.parent) {
                    group.parent = this.group.parent;
                }
            }
            group.screens.push(this);
            this.tree_states_done = [];
            this.order = null;
            this.group = group;
            this.model = group.model;
            if (group && group.length) {
                this.current_record = group[0];
            } else {
                this.current_record = null;
            }
            this.group.add_fields(fields);
            var views_add = function(view) {
                this.group.model.fields[name].views.add(view);
            }.bind(this);
            for (name in fields_views) {
                var views = fields_views[name];
                views.forEach(views_add);
            }
            this.group.exclude_field = this.exclude_field;
        },
        new_group: function(context) {
            if (!context) {
                context = this.context;
            }
            var group = new Sao.Group(this.model, context, []);
            group.readonly = this.attributes.readonly || false;
            this.set_group(group);
        },
        get current_record() {
            return this.__current_record;
        },
        set current_record(record) {
            this.__current_record = record;
            if (this.message_callback){
                var pos = null;
                var record_id = null;
                if (record) {
                    var i = this.group.indexOf(record);
                    if (i >= 0) {
                        pos = i + this.offset + 1;
                    } else {
                        pos = record.get_index_path();
                    }
                    record_id = record.id;
                }
                var data = [pos || 0, this.group.length + this.offset,
                    this.search_count, record_id];
                this.message_callback(data);
            }
            if (this.switch_callback) {
                this.switch_callback();
            }
            if (this.tab) {
                if (record) {
                    record.get_resources().always(
                        this.tab.update_resources.bind(this.tab));
                } else {
                    this.tab.update_resources();
                }
                this.tab.record_message();
            }
        },
        load: function(ids, set_cursor, modified) {
            if (set_cursor === undefined) {
                set_cursor = true;
            }
            this.tree_states = {};
            this.tree_states_done = [];
            this.group.load(ids, modified);
            if (ids.length && this.current_view.view_type != 'calendar') {
                this.current_record = this.group.get(ids[0]);
            } else {
                this.current_record = null;
            }
            return this.display().then(function() {
                if (set_cursor) {
                    this.set_cursor();
                }
            }.bind(this));
        },
        display: function(set_cursor) {
            var deferreds = [];
            if (this.current_record &&
                    ~this.current_record.group.indexOf(this.current_record)) {
            } else if (this.group && this.group.length &&
                    (this.current_view.view_type != 'calendar')) {
                this.current_record = this.group[0];
            } else {
                this.current_record = null;
            }
            if (this.views) {
                var search_prm = this.search_active(
                        ~['tree', 'graph', 'calendar'].indexOf(
                            this.current_view.view_type));
                deferreds.push(search_prm);
                for (var i = 0; i < this.views.length; i++) {
                    if (this.views[i] &&
                        ((this.views[i] == this.current_view) ||
                            this.views[i].el.parent().length)) {
                        deferreds.push(this.views[i].display());
                    }
                }
            }
            return jQuery.when.apply(jQuery, deferreds).then(function() {
                return this.set_tree_state().then(function() {
                    this.current_record = this.current_record;
                    // set_cursor must be called after set_tree_state because
                    // set_tree_state redraws the tree
                    if (set_cursor) {
                        this.set_cursor(false, false);
                    }
                }.bind(this));
            }.bind(this));
        },
        display_next: function() {
            var view = this.current_view;
            view.set_value();
            this.set_cursor(false, false);
            if (~['tree', 'form', 'list-form'].indexOf(view.view_type) &&
                    this.current_record && this.current_record.group) {
                var group = this.current_record.group;
                var record = this.current_record;
                while (group) {
                    var index = group.indexOf(record);
                    if (index < group.length - 1) {
                        record = group[index + 1];
                        break;
                    } else if (group.parent &&
                            (record.group.model.name ==
                             group.parent.group.model.name)) {
                        record = group.parent;
                        group = group.parent.group;
                    } else {
                        break;
                    }
                }
                this.current_record = record;
            } else {
                this.current_record = this.group[0];
            }
            this.set_cursor(false, false);
            view.display();
        },
        display_previous: function() {
            var view = this.current_view;
            view.set_value();
            this.set_cursor(false, false);
            if (~['tree', 'form', 'list-form'].indexOf(view.view_type) &&
                    this.current_record && this.current_record.group) {
                var group = this.current_record.group;
                var record = this.current_record;
                while (group) {
                    var index = group.indexOf(record);
                    if (index > 0) {
                        record = group[index - 1];
                        break;
                    } else if (group.parent &&
                            (record.group.model.name ==
                             group.parent.group.model.name)) {
                        record = group.parent;
                        group = group.parent.group;
                    } else {
                        break;
                    }
                }
                this.current_record = record;
            } else {
                this.current_record = this.group[0];
            }
            this.set_cursor(false, false);
            view.display();
        },
        clear: function() {
            this.current_record = null;
            this.group.clear();
        },
        default_row_activate: function() {
            if ((this.current_view.view_type == 'tree') &&
                    (this.current_view.attributes.keyword_open == 1)) {
                Sao.Action.exec_keyword('tree_open', {
                    'model': this.model_name,
                    'id': this.get_id(),
                    'ids': [this.get_id()]
                }, this.local_context, false);
            } else {
                if (!this.modified()) {
                    this.switch_view('form');
                }
            }
        },
        get_id: function() {
            if (this.current_record) {
                return this.current_record.id;
            }
        },
        new_: function(default_, rec_name) {
            var previous_view = this.current_view;
            if (default_ === undefined) {
                default_ = true;
            }
            var prm = jQuery.when();
            if (this.current_view.view_type == 'calendar') {
                var selected_date = this.current_view.get_selected_date();
                prm = this.switch_view('form');
            }
            if (this.current_view &&
                    ((this.current_view.view_type == 'tree' &&
                      !this.current_view.editable) ||
                     this.current_view.view_type == 'graph')) {
                prm = this.switch_view('form');
            }
            return prm.then(function() {
                var group;
                if (this.current_record) {
                    group = this.current_record.group;
                } else {
                    group = this.group;
                }
                var record = group.new_(false, undefined, rec_name);
                var prm;
                if (default_) {
                    prm = record.default_get(rec_name);
                } else {
                    prm = jQuery.when();
                }
                return prm.then(function() {
                    group.add(record, this.new_model_position());
                    this.current_record = record;
                    var prm = jQuery.when();
                    if (previous_view.view_type == 'calendar') {
                        prm = previous_view.set_default_date(
                            record, selected_date);
                    }
                    prm.then(function() {
                        this.display().done(function() {
                            this.set_cursor(true, true);
                        }.bind(this));
                    }.bind(this));
                    return record;
                }.bind(this));
            }.bind(this));
        },
        new_model_position: function() {
            var position = -1;
            if (this.current_view && (this.current_view.view_type == 'tree') &&
                    (this.current_view.attributes.editable == 'top')) {
                position = 0;
            }
            return position;
        },
        set_on_write: function(name) {
            if(name) {
                if (!~this.group.on_write.indexOf(name)) {
                    this.group.on_write.push(name);
                }
            }
        },
        cancel_current: function(initial_value) {
            var prms = [];
            if (this.current_record) {
                this.current_record.cancel();
                if (this.current_record.id < 0) {
                    if (initial_value) {
                        prms.push(
                            this.current_record.reset(initial_value).then(
                                this.display.bind(this)));
                    } else {
                        prms.push(this.remove(
                            false, false, false, [this.current_record]));
                    }
                }
            }
            return jQuery.when.apply(jQuery, prms);
        },
        save_current: function() {
            var current_record = this.current_record;
            if (!current_record) {
                if ((this.current_view.view_type == 'tree') &&
                        this.group && this.group.length) {
                    this.current_record = this.group[0];
                    current_record = this.current_record;
                } else {
                    return jQuery.when();
                }
            }
            this.current_view.set_value();
            var fields = this.current_view.get_fields();
            var path = current_record.get_path(this.group);
            var prm = jQuery.Deferred();
            if (this.current_view.view_type == 'tree') {
                prm = this.group.save().then(function() {
                    return this.current_record;
                }.bind(this));
            } else if (current_record.validate(fields, null, null, true)) {
                prm = current_record.save().then(function() {
                    return current_record;
                });
            } else {
                return this.current_view.display().then(function() {
                    this.set_cursor();
                    return jQuery.Deferred().reject();
                }.bind(this));
            }
            var display = function() {
                // Return the original promise to keep succeed/rejected state
                return this.display().then(function() {
                    return prm;
                }, function() {
                    return prm;
                });
            }.bind(this);
            return prm.then(function(current_record) {
                if (path && current_record && current_record.id) {
                    path.splice(-1, 1,
                            [path[path.length - 1][0], current_record.id]);
                }
                return this.group.get_by_path(path).then(function(record) {
                    this.current_record = record;
                }.bind(this));
            }.bind(this)).then(display, display);
        },
        set_cursor: function(new_, reset_view) {
            if (!this.current_view) {
                return;
            } else if (~['tree', 'form', 'list-form'].indexOf(
                    this.current_view.view_type)) {
                this.current_view.set_cursor(new_, reset_view);
            }
        },
        modified: function() {
            var test = function(record) {
                return (record.has_changed() || record.id < 0);
            };
            if (this.current_view.view_type != 'tree') {
                if (this.current_record) {
                    if (test(this.current_record)) {
                        return true;
                    }
                }
            } else {
                if (this.group.some(test)) {
                    return true;
                }
            }
            // TODO test view modified
            return false;
        },
        unremove: function() {
            var records = this.current_view.selected_records;
            records.forEach(function(record) {
                record.group.unremove(record);
            });
        },
        remove: function(delete_, remove, force_remove, records) {
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
            return prm.then(function() {
                records.forEach(function(record) {
                    record.group.remove(record, remove, true, force_remove);
                });
                var prms = [];
                if (delete_) {
                    records.forEach(function(record) {
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
                    prms.push(this.group.get_by_path(path).then(function(record) {
                        this.current_record = record;
                    }.bind(this)));
                } else if (this.group.length) {
                    this.current_record = this.group[0];
                }

                return jQuery.when.apply(jQuery, prms).then(function() {
                    this.display().done(function() {
                        this.set_cursor();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },
        copy: function() {
            var dfd = jQuery.Deferred();
            var records = this.current_view.selected_records;
            this.model.copy(records, this.context)
                .then(function(new_ids) {
                this.group.load(new_ids);
                if (!jQuery.isEmptyObject(new_ids)) {
                    this.current_record = this.group.get(new_ids[0]);
                }
                this.display().always(dfd.resolve);
            }.bind(this), dfd.reject);
            return dfd.promise();
        },
        search_active: function(active) {
            if (active && !this.group.parent) {
                this.screen_container.set_screen(this);
                this.screen_container.show_filter();
            } else {
                this.screen_container.hide_filter();
            }
            return jQuery.when();
        },
        get domain_parser() {
            var view_id, view_tree, domain_parser;
            if (this.current_view) {
                view_id = this.current_view.view_id;
            } else {
                view_id = null;
            }
            if (view_id in this._domain_parser) {
                return this._domain_parser[view_id];
            }
            if (!(view_id in this.fields_view_tree)) {
                view_tree = this.model.execute('fields_view_get', [false, 'tree'],
                    this.context, false);
                this.fields_view_tree[view_id] = view_tree;
            } else {
                view_tree = this.fields_view_tree[view_id];
            }
            var fields = jQuery.extend({}, view_tree.fields);

            var set_selection = function(props) {
                return function(selection) {
                    props.selection = selection;
                };
            };
            for (var name in fields) {
                var props = fields[name];
                if ((props.type != 'selection') &&
                        (props.type != 'reference')) {
                    continue;
                }
                if (props.selection instanceof Array) {
                    continue;
                }
                this.get_selection(props).then(set_selection(props));
            }

            if ('arch' in view_tree) {
                // Filter only fields in XML view
                var xml_view = jQuery(jQuery.parseXML(view_tree.arch));
                var dom_fields = {};
                xml_view.find('tree').children().each(function(i, node) {
                    if (node.tagName == 'field') {
                        var name = node.getAttribute('name');
                        // If a field is defined multiple times in the XML,
                        // take only the first definition
                        if (!(name in dom_fields)) {
                            dom_fields[name] = fields[name];
                            ['string', 'factor'].forEach(function(attr) {
                                if (node.getAttribute(attr)) {
                                    dom_fields[name][attr] = node.getAttribute(attr);
                                }
                            });
                        }
                    }
                });
                fields = dom_fields;
            }

            if ('active' in view_tree.fields) {
                this.screen_container.but_active.show();
            } else {
                this.screen_container.but_active.hide();
            }

            // Add common fields
            [
                ['id', Sao.i18n.gettext('ID'), 'integer'],
                ['create_uid', Sao.i18n.gettext('Creation User'),
                    'many2one'],
                ['create_date', Sao.i18n.gettext('Creation Date'),
                    'datetime'],
                ['write_uid', Sao.i18n.gettext('Modification User'),
                     'many2one'],
                ['write_date', Sao.i18n.gettext('Modification Date'),
                     'datetime']
                    ] .forEach(function(e) {
                        var name = e[0];
                        var string = e[1];
                        var type = e[2];
                        if (!(name in fields)) {
                            fields[name] = {
                                'string': string,
                                'name': name,
                                'type': type
                            };
                            if (type == 'datetime') {
                                fields[name].format = '"%H:%M:%S"';
                            }
                        }
                    });

            domain_parser = new Sao.common.DomainParser(fields, this.context);
            this._domain_parser[view_id] = domain_parser;
            return domain_parser;
        },
        get_selection: function(props) {
            var prm;
            var change_with = props.selection_change_with;
            if (!jQuery.isEmptyObject(change_with)) {
                var values = {};
                change_with.forEach(function(p) {
                    values[p] = null;
                });
                prm = this.model.execute(props.selection,
                        [values]);
            } else {
                prm = this.model.execute(props.selection,
                        []);
            }
            return prm.then(function(selection) {
                return selection.sort(function(a, b) {
                    return a[1].localeCompare(b[1]);
                });
            });
        },
        search_prev: function(search_string) {
            if (this.limit) {
                this.offset = Math.max(this.offset - this.limit, 0);
            }
            this.search_filter(search_string);
        },
        search_next: function(search_string) {
            if (this.limit) {
                this.offset += this.limit;
            }
            this.search_filter(search_string);
        },
        invalid_message: function(record) {
            if (!record) {
                record = this.current_record;
            }
            var fields_desc = {};
            for (var fname in record.model.fields) {
                var field = record.model.fields[fname];
                fields_desc[fname] = field.description;
            }
            var domain_parser = new Sao.common.DomainParser(fields_desc);
            var fields = [];
            var invalid_fields = record.invalid_fields();
            Object.keys(invalid_fields).sort().forEach(
                function(field) {
                    var invalid = invalid_fields[field];
                    var string = record.model.fields[field].description.string;
                    if ((invalid == 'required') ||
                            (Sao.common.compare(invalid,
                                                [[field, '!=', null]]))) {
                        fields.push(Sao.i18n.gettext('"%1" is required', string));
                    } else if (invalid == 'domain') {
                        fields.push(Sao.i18n.gettext(
                                    '"%1" is not valid according to its domain',
                                    string));
                    } else if (invalid == 'children') {
                        fields.push(Sao.i18n.gettext(
                                'The values of "%1" are not valid', string));
                    } else {
                        if (domain_parser.stringable(invalid)) {
                            fields.push(domain_parser.string(invalid));
                        } else {
                            fields.push(Sao.i18n.gettext(
                                    '"%1" is not valid according to its domain'),
                                string);
                        }
                    }
                });
            if (fields.length > 5) {
                fields.splice(5, fields.length);
                fields.push('...');
            }
            return fields.join('\n');
        },
        get: function() {
            if (!this.current_record) {
                return null;
            }
            this.current_view.set_value();
            return this.current_record.get();
        },
        get_on_change_value: function() {
            if (!this.current_record) {
                return null;
            }
            this.current_view.set_value();
            return this.current_record.get_on_change_value();
        },
        reload: function(ids, written) {
            this.group.reload(ids);
            var promises = [];
            if (written) {
                promises.push(this.group.written(ids));
            }
            if (this.group.parent) {
                promises.push(this.group.parent.root_parent.reload());
            }
            return jQuery.when.apply(jQuery, promises).then(function() {
                this.display();
            }.bind(this));
        },
        get_buttons: function() {
            var selected_records = this.current_view.selected_records;
            if (jQuery.isEmptyObject(selected_records)) {
                return [];
            }
            var buttons = this.current_view.get_buttons();
            selected_records.forEach(function(record) {
                buttons = buttons.filter(function(button) {
                    if (button.attributes.type === 'instance') {
                        return false;
                    }
                    var states = record.expr_eval(
                        button.attributes.states || {});
                    return !(states.invisible || states.readonly);
                });
            });
            return buttons;
        },
        button: function(attributes) {
            var ids;
            var process_action = function(action) {
                return this.reload(ids, true).then(function() {
                    if (typeof action == 'string') {
                        this.client_action(action);
                    }
                    else if (action) {
                        Sao.Action.execute(action, {
                            model: this.model_name,
                            id: this.current_record.id,
                            ids: ids
                        }, null, this.context, true);
                    }
                }.bind(this));
            };

            var selected_records = this.current_view.selected_records;
            this.current_view.set_value();
            var fields = this.current_view.get_fields();

            var prms = [];
            var reset_state = function(record) {
                return function() {
                    this.display(true);
                    // Reset valid state with normal domain
                    record.validate(fields);
                }.bind(this);
            }.bind(this);
            for (var i = 0; i < selected_records.length; i++) {
                var record = selected_records[i];
                var domain = record.expr_eval(
                    (attributes.states || {})).pre_validate || [];
                prms.push(record.validate(fields, false, domain));
            }
            return jQuery.when.apply(jQuery, prms).then(function() {
                var record;
                for (var i = 0; i < selected_records.length; i++) {
                    record = selected_records[i];
                    var result = arguments[i];
                    if (result) {
                        continue;
                    }
                    Sao.common.warning.run(
                            this.invalid_message(record),
                            Sao.i18n.gettext('Pre-validation'))
                        .then(reset_state(record));
                    return;
                }
                var prm = jQuery.when();
                if (attributes.confirm) {
                    prm = Sao.common.sur.run(attributes.confirm);
                }
                return prm.then(function() {
                    var record = this.current_record;
                    if (attributes.type === 'instance') {
                        var args = record.expr_eval(attributes.change || []);
                        var values = record._get_on_change_args(args);
                        return record.model.execute(attributes.name, [values],
                            this.context).then(function(changes) {
                            record.set_on_change(changes).then(function() {
                                record.group.root_group.screens.forEach(
                                    function(screen) {
                                        screen.display();
                                    });
                            });
                        });
                    } else {
                        return record.save(false).then(function() {
                            var context = this.context;
                            context._timestamp = {};
                            ids = [];
                            for (i = 0; i < selected_records.length; i++) {
                                record = selected_records[i];
                                jQuery.extend(context._timestamp,
                                    record.get_timestamp());
                                ids.push(record.id);
                            }
                            return record.model.execute(attributes.name,
                                [ids], context).then(process_action.bind(this));
                        }.bind(this));
                    }
                }.bind(this));
            }.bind(this));
        },
        client_action: function(action) {
            var access = Sao.common.MODELACCESS.get(this.model_name);
            if (action == 'new') {
                if (access.create) {
                    this.new_();
                }
            } else if (action == 'delete') {
                if (access['delete']) {
                    this.remove(!this.group.parent, false, !this.group.parent);
                }
            } else if (action == 'remove') {
                if (access.write && access.read && this.group.parent) {
                    this.remove(false, true, false);
                }
            } else if (action == 'copy') {
                if (access.create) {
                    this.copy();
                }
            } else if (action == 'next') {
                this.display_next();
            } else if (action == 'previous') {
                this.display_previous();
            } else if (action == 'close') {
                Sao.Tab.close_current();
            } else if (action.startsWith('switch')) {
                this.switch_view.apply(this, action.split(' ', 3).slice(1));
            } else if (action == 'reload') {
                if (~['tree', 'graph', 'calendar'].indexOf(this.current_view.view_type) &&
                        !this.group.parent) {
                    this.search_filter();
                }
            } else if (action == 'reload menu') {
                Sao.Session.current_session.reload_context()
                    .then(function() {
                        Sao.menu();
                    });
            } else if (action == 'reload context') {
                Sao.Session.current_session.reload_context();
            }
        },
        get_url: function(name) {
            function dumps(value) {
                return JSON.stringify(Sao.rpc.prepareObject(value));
            }
            var query_string = [];
            if (!jQuery.isEmptyObject(this.domain)) {
                query_string.push(['domain', dumps(this.domain)]);
            }
            var context = this.local_context;  // Avoid rpc context
            if (!jQuery.isEmptyObject(context)) {
                query_string.push(['context', dumps(context)]);
            }
            if (this.context_screen) {
                query_string.push(
                    ['context_model', this.context_screen.model_name]);
            }
            if (name) {
                query_string.push(['name', dumps(name)]);
            }
            if (this.attributes.tab_domain) {
                query_string.push([
                    'tab_domain', dumps(this.attributes.tab_domain)]);
            }
            var path = ['model', this.model_name];
            var view_ids = this.views.map(
                function(v) {return v.view_id;}).concat(this.view_ids);
            if (this.current_view.view_type != 'form') {
                var search_value;
                if (this.attributes.search_value) {
                    search_value = this.attributes.search_value;
                } else {
                    var search_string = this.screen_container.get_text();
                    search_value = this.domain_parser.parse(search_string);
                }
                if (!jQuery.isEmptyObject(search_value)) {
                    query_string.push(['search_value', dumps(search_value)]);
                }
            } else if (this.current_record && (this.current_record.id > -1)) {
                path.push(this.current_record.id);
                var i = view_ids.indexOf(this.current_view.view_id);
                view_ids = view_ids.slice(i).concat(view_ids.slice(0, i));
            }
            if (!jQuery.isEmptyObject(view_ids)) {
                query_string.push(['views', dumps(view_ids)]);
            }
            query_string = query_string.map(function(e) {
                return e.map(encodeURIComponent).join('=');
            }).join('&');
            path = path.join('/');
            if (query_string) {
                path += ';' + query_string;
            }
            return path;
        },
        save_tree_state: function(store) {
            var prms = [];
            var prm;
            store = (store === undefined) ? true : store;
            var i, len, view, widgets, wi, wlen;
            var parent_ = this.group.parent ? this.group.parent.id : null;
            for (i = 0, len = this.views.length; i < len; i++) {
                view = this.views[i];
                if (view.view_type == 'form') {
                    for (var wid_key in view.widgets) {
                        if (!view.widgets.hasOwnProperty(wid_key)) {
                            continue;
                        }
                        widgets = view.widgets[wid_key];
                        for (wi = 0, wlen = widgets.length; wi < wlen; wi++) {
                            if (widgets[wi].screen) {
                                prm = widgets[wi].screen.save_tree_state(store);
                                prms.push(prm);
                            }
                        }
                    }
                    if ((this.views.length == 1) && this.current_record) {
                        if (!(parent_ in this.tree_states)) {
                            this.tree_states[parent_] = {};
                        }
                        this.tree_states[parent_][
                            view.children_field || null] = [
                                [], [[this.current_record.id]]];
                    }
                } else if (view.view_type == 'tree') {
                    var paths = view.get_expanded_paths();
                    var selected_paths = view.get_selected_paths();
                    if (!(parent_ in this.tree_states)) {
                        this.tree_states[parent_] = {};
                    }
                    this.tree_states[parent_][view.children_field || null] = [
                        paths, selected_paths];
                    if (store && view.attributes.tree_state) {
                        var tree_state_model = new Sao.Model(
                                'ir.ui.view_tree_state');
                        prm = tree_state_model.execute('set', [
                                this.model_name,
                                this.get_tree_domain(parent_),
                                view.children_field,
                                JSON.stringify(paths),
                                JSON.stringify(selected_paths)], {});
                        prms.push(prm);
                    }
                }
            }
            return jQuery.when.apply(jQuery, prms).then(function() {
                Sao.Session.current_session.cache.clear(
                    'model.ir.ui.view_tree_state.get');
            });
        },
        get_tree_domain: function(parent_) {
            var domain;
            if (parent_) {
                domain = (this.domain || []).concat([
                        [this.exclude_field, '=', parent_]]);
            } else {
                domain = this.domain;
            }
            return JSON.stringify(Sao.rpc.prepareObject(domain));
        },
        set_tree_state: function() {
            var parent_, state, state_prm, tree_state_model;
            var view = this.current_view;
            if (!~['tree', 'form'].indexOf(view.view_type)) {
                return jQuery.when();
            }

            if (~this.tree_states_done.indexOf(view)) {
                return jQuery.when();
            }
            if (view.view_type == 'form' &&
                    !jQuery.isEmptyObject(this.tree_states_done)) {
                return jQuery.when();
            }
            if (view.view_type == 'tree' && !view.attributes.tree_state) {
                this.tree_states_done.push(view);
            }

            parent_ = this.group.parent ? this.group.parent.id : null;
            if (parent_ < 0) {
                return jQuery.when();
            }
            if (!(parent_ in this.tree_states)) {
                this.tree_states[parent_] = {};
            }
            state = this.tree_states[parent_][view.children_field || null];
            if (state === undefined) {
                tree_state_model = new Sao.Model('ir.ui.view_tree_state');
                state_prm = tree_state_model.execute('get', [
                        this.model_name,
                        this.get_tree_domain(parent_),
                        view.children_field], {})
                    .then(function(state) {
                        state = [JSON.parse(state[0]), JSON.parse(state[1])];
                        if (!(parent_ in this.tree_states)) {
                            this.tree_states[parent_] = {};
                        }
                        this.tree_states[parent_][view.children_field || null] = state;
                        return state;
                    }.bind(this));
            } else {
                state_prm = jQuery.when(state);
            }
            this.tree_states_done.push(view);
            return state_prm.done(function(state) {
                var expanded_nodes, selected_nodes, record;
                expanded_nodes = state[0];
                selected_nodes = state[1];
                if (view.view_type == 'tree') {
                    return view.display(selected_nodes, expanded_nodes);
                } else {
                    if (!jQuery.isEmptyObject(selected_nodes)) {
                        for (var i = 0; i < selected_nodes[0].length; i++) {
                            var new_record = this.group.get(selected_nodes[0][i]);
                            if (!new_record) {
                                break;
                            } else {
                                record = new_record;
                            }
                        }
                        if (record && (record != this.current_record)) {
                            this.current_record = record;
                            // Force a display of the view to synchronize the
                            // widgets with the new record
                            view.display();
                        }
                    }
                }
            }.bind(this));
        }
    });
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.View = Sao.class_(Object, {
        view_type: null,
        el: null,
        mnemonic_widget: null,
        view_id: null,
        editable: null,
        children_field: null,
        xml_parser: null,
        init: function(view_id, screen, xml) {
            this.view_id = view_id;
            this.screen = screen;
            this.widgets = {};
            this.state_widgets = [];
            var attributes = xml.children()[0].attributes;
            this.attributes = {};
            for (var i = 0, len = attributes.length; i < len; i++) {
                var attribute = attributes[i];
                this.attributes[attribute.name] = attribute.value;
            }
            screen.set_on_write(this.attributes.on_write);

            var field_attrs = {};
            for (var name in this.screen.model.fields) {
                field_attrs[name] = this.screen.model.fields[name].description;
            }
            if (this.xml_parser) {
                new this.xml_parser(
                    this, this.screen.exclude_field, field_attrs)
                    .parse(xml.children()[0]);
            }
        },
        set_value: function() {
        },
        get record() {
            return this.screen.current_record;
        },
        set record(value) {
            this.screen.current_record = value;
        },
        get group() {
            return this.screen.group;
        },
        get selected_records() {
            return [];
        },
        get_fields: function() {
            return [];
        },
        get_buttons: function() {
            return [];
        },
    });

    Sao.View.idpath2path = function(tree, idpath) {
        var path = [];
        var child_path;
        if (!idpath) {
            return [];
        }
        for (var i = 0, len = tree.rows.length; i < len; i++) {
            if (tree.rows[i].record.id == idpath[0]) {
                path.push(i);
                child_path = Sao.View.idpath2path(tree.rows[i],
                        idpath.slice(1, idpath.length));
                path = path.concat(child_path);
                break;
            }
        }
        return path;
    };

    Sao.View.parse = function(screen, view_id, type, xml, children_field) {
        switch (type) {
            case 'tree':
                return new Sao.View.Tree(view_id, screen, xml, children_field);
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

    Sao.View.XMLViewParser = Sao.class_(Object, {
        init: function(view, exclude_field, field_attrs) {
            this.view = view;
            this.exclude_field = exclude_field;
            this.field_attrs = field_attrs;
        },
        _node_attributes: function(node) {
            var node_attrs = {};
            for (var i = 0; i < node.attributes.length; i++) {
                var attribute = node.attributes[i];
                node_attrs[attribute.name] = attribute.value;
            }

            var field = {};
            if (node_attrs.name) {
                field = this.field_attrs[node_attrs.name] || {};
            }

            ['readonly', 'homogeneous'].forEach(function(name) {
                if (node_attrs[name]) {
                    node_attrs[name] = node_attrs[name] == 1;
                }
            });
            ['yexpand', 'yfill', 'xexpand', 'xfill', 'colspan',
                'position', 'height', 'width'].forEach(function(name) {
                    if (node_attrs[name]) {
                        node_attrs[name] = Number(node_attrs[name]);
                    }
            });
            ['xalign', 'yalign'].forEach(function(name) {
                if (node_attrs[name]) {
                    node_attrs[name] = Number(node_attrs[name]);
                }
            });

            if (!jQuery.isEmptyObject(field)) {
                if (!node_attrs.widget) {
                    node_attrs.widget = field.type;
                }
                if ((node.tagName == 'label') && (!node_attrs.string)) {
                    node_attrs.string = field.string + Sao.i18n.gettext(':');
                }
                if ((node.tagName == 'field') && (!node_attrs.help)) {
                    node_attrs.help = field.help;
                }

                ['relation', 'domain', 'selection', 'string', 'states',
                    'relation_field', 'views', 'invisible', 'add_remove',
                    'sort', 'context', 'size', 'filename', 'autocomplete',
                    'translate', 'create', 'delete', 'selection_change_with',
                    'schema_model'].forEach(function(name) {
                        if ((name in field) && (!(name in node_attrs))) {
                            node_attrs[name] = field[name];
                        }
                    });
            }
            return node_attrs;
        },
        parse: function(node) {
            if (node.tagName) {
                var attributes = this._node_attributes(node);
                this['_parse_' + node.tagName](node, attributes);
            }
        },
    });
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */

/* jshint ignore:start */
// Must be defined in non strict context otherwise is invalid
function eval_pyson(value){

    return {}
    // with (Sao.PYSON.eval) {
    //     // Add parenthesis to parse as object instead of statement
    //     return eval('(' + value + ')');
    // }
}
/* jshint ignore:end */

(function() {
    'use strict';

    Sao.View.FormXMLViewParser = Sao.class_(Sao.View.XMLViewParser, {
        init: function(view, exclude_field, field_attrs) {
            Sao.View.FormXMLViewParser._super.init.call(
                this, view, exclude_field, field_attrs);
            this._containers = [];
            this._mnemonics = {};
        },
        get container() {
            if (this._containers.length > 0) {
                return this._containers[this._containers.length - 1];
            }
            return null;
        },
        _parse_form: function(node, attributes) {
            var container = new Sao.View.Form.Container(
                Number(node.getAttribute('col') || 4));
            this.view.containers.push(container);
            this.view.el.append(container.el);
            this.parse_child(node, container);
            if (this._containers.length > 0) {
                throw 'AssertionError';
            }
        },
        parse_child: function(node, container) {
            if (container) {
                this._containers.push(container);
            }
            [].forEach.call(node.childNodes, function(child) {
                this.parse(child);
            }.bind(this));
            if (container) {
                this._containers.pop();
            }
        },
        _parse_field: function(node, attributes) {
            var name = attributes.name;
            if (name && (name == this.exclude_field)) {
                this.container.add(null, attributes);
                return;
            }
            var WidgetFactory = Sao.View.FormXMLViewParser.WIDGETS[
                attributes.widget];
            var widget = new WidgetFactory(this.view, attributes);
            if (!this.view.widgets[name]) {
                this.view.widgets[name] = [];
            }
            this.view.widgets[name].push(widget);
            widget.position = this.view.widget_id += 1;

            if (widget.expand) {
                if (attributes.yexpand === undefined) {
                    attributes.yexpand = true;
                }
                if (attributes.yfill === undefined) {
                    attributes.yfill = true;
                }
            }

            if (attributes.height !== undefined) {
                widget.el.css('min-height', attributes.height + 'px');
            }
            if (attributes.width !== undefined) {
                widget.el.css('min-width', attributes.width + 'px');
            }

            this.container.add(widget, attributes);

            if (this._mnemonics[name] && widget.labelled) {
                var label = this._mnemonics[name];
                label.el.uniqueId();
                widget.labelled.uniqueId();
                widget.labelled.attr('aria-labelledby', label.el.attr('id'));
                label.el.attr('for', widget.labelled.attr('id'));
            }
        },
        _parse_button: function(node, attributes) {
            var button = new Sao.common.Button(attributes);
            button.el.click(button, this.view.button_clicked.bind(this.view));
            this.view.state_widgets.push(button);
            this.container.add(button, attributes);
        },
        _parse_image: function(node, attributes) {
            var image = new Sao.View.Form.Image_(attributes);
            this.view.state_widgets.push(image);
            this.container.add(image, attributes);
        },
        _parse_separator: function(node, attributes) {
            var text = attributes.string;
            var separator = new Sao.View.Form.Separator(text, attributes);
            this.view.state_widgets.push(separator);
            this.container.add(separator, attributes);
        },
        _parse_label: function(node, attributes) {
            var name = attributes.name;
            if (name && (name == this.exclude_field)) {
                this.container.add(null, attributes);
                return;
            }
            if (attributes.xexpand === undefined) {
                attributes.xexpand = 0;
            }
            if (attributes.xalign === undefined) {
                attributes.xalign = 1.0;
            }
            var label = new Sao.View.Form.Label(attributes.string, attributes);
            this.view.state_widgets.push(label);
            this.container.add(label, attributes);
            if (name) {
                this._mnemonics[name] = label;
            }
        },
        _parse_newline: function(node, attributes) {
            this.container.add_row();
        },
        _parse_notebook: function(node, attributes) {
            if (attributes.colspan === undefined) {
                attributes.colspan = 4;
            }
            var notebook = new Sao.View.Form.Notebook(attributes);
            if (attributes.height !== undefined) {
                notebook.el.css('min-height', attributes.height + 'px');
            }
            if (attributes.width !== undefined) {
                notebook.el.css('min-width', attributes.width + 'px');
            }
            this.view.state_widgets.push(notebook);
            this.view.notebooks.push(notebook);
            this.container.add(notebook, attributes);
            this.parse_child(node, notebook);
        },
        _parse_page: function(node, attributes) {
            if (attributes.name && (attributes.name == this.exclude_field)) {
                return;
            }
            var container = new Sao.View.Form.Container(
                Number(node.getAttribute('col') || 4));
            this.view.containers.push(container);
            this.parse_child(node, container);
            var page = new Sao.View.Form.Page(
                this.container.add(
                    container.el, attributes.string, attributes.icon),
                attributes);
            this.view.state_widgets.push(page);
        },
        _parse_group: function(node, attributes) {
            var group = new Sao.View.Form.Container(
                Number(node.getAttribute('col') || 4));
            this.view.containers.push(group);
            this.parse_child(node, group);

            if (attributes.name && (attributes.name == this.exclude_field)) {
                this.container.add(null, attributes);
                return;
            }

            var widget;
            if (attributes.expandable !== undefined) {
                widget = new Sao.View.Form.Expander(attributes);
                widget.set_expanded(attributes.expandable === '1');
                this.view.expandables.push(widget);
            } else {
                widget = new Sao.View.Form.Group(attributes);
            }
            widget.add(group);

            this.view.state_widgets.push(widget);
            this.container.add(widget, attributes);
        },
        _parse_hpaned: function(node, attributes) {
            this._parse_paned(node, attributes, 'horizontal');
        },
        _parse_vpaned: function(node, attributes) {
            this._parse_paned(node, attributes, 'vertical');
        },
        _parse_paned: function(node, attributes, orientation) {
            var paned = new Sao.common.Paned(orientation);
            // TODO position
            this.container.add(paned, attributes);
            this.parse_child(node, paned);
        },
        _parse_child: function(node, attributes) {
            var paned = this.container;
            var container = new Sao.View.Form.Container(
                Number(node.getAttribute('col') || 4));
            this.view.containers.push(container);
            this.parse_child(node, container);

            var child;
            if (!paned.get_child1().children().length) {
                child = paned.get_child1();
            } else {
                child = paned.get_child2();
            }
            child.append(container.el);
        },
    });

    Sao.View.Form = Sao.class_(Sao.View, {
        editable: true,
        view_type: 'form',
        xml_parser: Sao.View.FormXMLViewParser,
        init: function(view_id, screen, xml) {
            this.el = jQuery('<div/>', {
                'class': 'form'
            });
            this.notebooks = [];
            this.expandables = [];
            this.containers = [];
            this.widget_id = 0;
            Sao.View.Form._super.init.call(this, view_id, screen, xml);
        },
        get_fields: function() {
            return Object.keys(this.widgets);
        },
        get_buttons: function() {
            var buttons = [];
            for (var j in this.state_widgets) {
                var widget = this.state_widgets[j];
                if (widget instanceof Sao.common.Button) {
                    buttons.push(widget);
                }
            }
            return buttons;
        },
        display: function() {
            var record = this.record;
            var field;
            var name;
            var promesses = [];
            if (record) {
                // Force to set fields in record
                // Get first the lazy one from the view to reduce number of requests
                var fields = [];
                for (name in this.widgets) {
                    field = record.model.fields[name];
                    fields.push([
                        name,
                        field.description.loading || 'eager' == 'eager',
                        field.views.size,
                    ]);
                }
                fields.sort(function(a, b) {
                    if (!a[1] && b[1]) {
                        return -1;
                    } else if (a[1] && !b[1]) {
                        return 1;
                    } else {
                        return a[2] - b[2];
                    }
                });
                fields.forEach(function(e) {
                    var name = e[0];
                    promesses.push(record.load(name));
                });
            }
            var display = function(widget) {
                widget.display();
            };
            return jQuery.when.apply(jQuery,promesses)
                .done(function() {
                    var record = this.record;
                    for (name in this.widgets) {
                        var widgets = this.widgets[name];
                        field = null;
                        if (record) {
                            field = record.model.fields[name];
                        }
                        if (field) {
                            field.set_state(record);
                        }
                        widgets.forEach(display);
                    }
                }.bind(this))
                .done(function() {
                    var record = this.record;
                    var j;
                    for (j in this.state_widgets) {
                        var state_widget = this.state_widgets[j];
                        state_widget.set_state(record);
                    }
                    for (j in this.containers) {
                        var container = this.containers[j];
                        container.resize();
                    }
                }.bind(this));
        },
        set_value: function() {
            var record = this.record;
            if (record) {
                var set_value = function(widget) {
                    widget.set_value(record, this);
                };
                for (var name in this.widgets) {
                    if (name in record.model.fields) {
                        var widgets = this.widgets[name];
                        var field = record.model.fields[name];
                        widgets.forEach(set_value, field);
                    }
                }
            }
        },
        button_clicked: function(event) {
            var button = event.data;
            button.el.prop('disabled', true);
            this.screen.button(button.attributes).always(function() {
                button.el.prop('disabled', false);
            });
        },
        get selected_records() {
            if (this.record) {
                return [this.record];
            }
            return [];
        },
        set_cursor: function(new_, reset_view) {
            var i, name, j;
            var focus_el, notebook, child, group;
            var widgets, error_el, pages, is_ancestor;

            var currently_focused = jQuery(document.activeElement);
            var has_focus = currently_focused.closest(this.el).length > 0;
            if (reset_view || !has_focus) {
                if (reset_view) {
                    for (i = 0; i < this.notebooks.length; i++) {
                        notebook = this.notebooks[i];
                        notebook.set_current_page();
                    }
                }
                if (this.attributes.cursor in this.widgets) {
                    focus_el = Sao.common.find_focusable_child(
                            this.widgets[this.attributes.cursor][0].el);
                } else {
                    child = Sao.common.find_focusable_child(this.el);
                    if (child) {
                        child.focus();
                    }
                }
            }

            var record = this.record;
            if (record) {
                var invalid_widgets = [];
                // We use the has-error class to find the invalid elements
                // because Sao.common.find_focusable_child use the :visible
                // selector which acts differently than GTK's get_visible
                var error_els = this.el.find('.has-error');
                var invalid_fields = record.invalid_fields();
                for (name in invalid_fields) {
                    widgets = this.widgets[name] || [];
                    for (i = 0; i < error_els.length; i++) {
                        error_el = jQuery(error_els[i]);
                        for (j = 0; j < widgets.length; j++) {
                            if (error_el.closest(widgets[j].el).length > 0) {
                                invalid_widgets.push(error_el);
                                break;
                            }
                        }
                    }
                }
                if (invalid_widgets.length > 0) {
                    focus_el = Sao.common.find_first_focus_widget(this.el,
                            invalid_widgets);
                }
            }

            if (focus_el) {
                for (i = 0; i < this.notebooks.length; i++) {
                    notebook = this.notebooks[i];
                    pages = notebook.get_n_pages();
                    for (j = 0; j < pages; j++) {
                        child = notebook.get_nth_page(j);
                        is_ancestor = (
                                jQuery(focus_el).closest(child).length > 0);
                        if (is_ancestor) {
                            notebook.set_current_page(j);
                            break;
                        }
                    }
                }
                for (i = 0; i < this.expandables.length; i++) {
                    group = this.expandables[i];
                    is_ancestor = (
                            jQuery(focus_el).closest(group.el).length > 0);
                    if (is_ancestor) {
                        group.set_expanded(true);
                    }
                }
                jQuery(focus_el).find('input,select,textarea')
                    .addBack(focus_el).focus();
            }
        }
    });

    Sao.View.Form.Container = Sao.class_(Object, {
        init: function(col) {
            if (col === undefined) col = 4;
            if (col < 0) col = 0;
            this.col = col;
            this.el = jQuery('<table/>', {
                'class': 'form-container responsive responsive-noheader'
            });
            this.body = jQuery('<tbody/>').appendTo(this.el);
            if (this.col <= 0) {
                this.el.addClass('form-hcontainer');
            } else if (this.col == 1) {
                this.el.addClass('form-vcontainer');
            }
            this.add_row();
        },
        add_row: function() {
            this.body.append(jQuery('<tr/>'));
        },
        rows: function() {
            return this.body.children('tr');
        },
        row: function() {
            return this.rows().last();
        },
        add: function(widget, attributes) {
            var colspan = attributes.colspan;
            if (colspan === undefined) colspan = 1;
            var xfill = attributes.xfill;
            if (xfill === undefined) xfill = 1;
            var xexpand = attributes.xexpand;
            if (xexpand === undefined) xexpand = 1;
            var row = this.row();
            if (this.col > 0) {
                var len = 0;
                row.children().map(function(i, e) {
                    len += Number(jQuery(e).attr('colspan') || 1);
                });
                if (len + colspan > this.col) {
                    this.add_row();
                    row = this.row();
                }
            }
            var el;
            if (widget) {
                el = widget.el;
            }
            var cell = jQuery('<td/>', {
                'colspan': colspan,
                'class': widget ? widget.class_ || '' : ''
            }).append(el);
            row.append(cell);

            if (!widget) {
                return;
            }

            if (attributes.yexpand) {
                cell.css('height', '100%');
            }
            if (attributes.yfill) {
                cell.css('vertical-align', 'top');
            }

            if (attributes.xalign !== undefined) {
                // TODO replace by start/end when supported
                var align;
                if (Sao.i18n.rtl) {
                    align = attributes.xalign >= 0.5? 'left': 'right';
                } else {
                    align = attributes.xalign >= 0.5? 'right': 'left';
                }
                cell.css('text-align', align);
            }
            if (xexpand) {
                cell.addClass('xexpand');
                cell.css('width', '100%');
            }
            if (xfill) {
                cell.addClass('xfill');
                if (xexpand) {
                    el.css('width', '100%');
                }
            }

            if (attributes.help) {
                widget.el.attr('title', attributes.help);
            }
        },
        resize: function() {
            var rows = this.rows().toArray();
            var widths = [];
            var col = this.col;
            var has_expand = false;
            var i, j;
            var get_xexpands = function(row) {
                row = jQuery(row);
                var xexpands = [];
                i = 0;
                row.children().map(function() {
                    var cell = jQuery(this);
                    var colspan = Math.min(Number(cell.attr('colspan')), col);
                    if (cell.hasClass('xexpand') &&
                        (!jQuery.isEmptyObject(cell.children())) &&
                        (cell.children(':not(.tooltip)').css('display') != 'none')) {
                        xexpands.push([cell, i]);
                    }
                    i += colspan;
                });
                return xexpands;
            };
            // Sort rows to compute first the most constraining row
            // which are the one with the more xexpand cells
            // and with the less colspan
            rows.sort(function(a, b) {
                a = get_xexpands(a);
                b = get_xexpands(b);
                if (a.length == b.length) {
                    var reduce = function(previous, current) {
                        var cell = current[0];
                        var colspan = Math.min(
                            Number(cell.attr('colspan')), col);
                        return previous + colspan;
                    };
                    return a.reduce(reduce, 0) - b.reduce(reduce, 0);
                } else {
                    return b.length - a.length;
                }
            });
            rows.forEach(function(row) {
                row = jQuery(row);
                var xexpands = get_xexpands(row);
                var width = 100 / xexpands.length;
                xexpands.forEach(function(e) {
                    var cell = e[0];
                    i = e[1];
                    var colspan = Math.min(Number(cell.attr('colspan')), col);
                    var current_width = 0;
                    for (j = 0; j < colspan; j++) {
                        current_width += widths[i + j] || 0;
                    }
                    for (j = 0; j < colspan; j++) {
                        if (!current_width) {
                            widths[i + j] = width / colspan;
                        } else if (current_width > width) {
                            // Split proprotionally the difference over all cells
                            // following their current width
                            var diff = current_width - width;
                            if (widths[i + j]) {
                                widths[i + j] -= (diff /
                                    (current_width / widths[i + j]));
                            }
                        }
                    }
                });
                if (!jQuery.isEmptyObject(xexpands)) {
                    has_expand = true;
                }
            });
            rows.forEach(function(row) {
                row = jQuery(row);
                i = 0;
                row.children().map(function() {
                    var cell = jQuery(this);
                    var colspan = Math.min(Number(cell.attr('colspan')), col);
                    if (cell.hasClass('xexpand') &&
                        (cell.children(':not(.tooltip)').css('display') !=
                         'none')) {
                        var width = 0;
                        for (j = 0; j < colspan; j++) {
                            width += widths[i + j] || 0;
                        }
                        cell.css('width', width + '%');
                    } else {
                        cell.css('width', '');
                    }
                    // show/hide when container is horizontal or vertical
                    // to not show padding
                    if (cell.children().css('display') == 'none') {
                        cell.css('visibility', 'collapse');
                        if (col <= 1) {
                            cell.hide();
                        }
                    } else {
                        cell.css('visibility', 'visible');
                        if (col <= 1) {
                            cell.show();
                        }
                    }
                    i += colspan;
                });
            });
            if (has_expand) {
                this.el.css('width', '100%');
            } else {
                this.el.css('width', '');
            }
        }
    });

    Sao.View.Form.StateWidget = Sao.class_(Object, {
        init: function(attributes) {
            this.attributes = attributes;
        },
        set_state: function(record) {
            var state_changes;
            if (record) {
                state_changes = record.expr_eval(this.attributes.states || {});
            } else {
                state_changes = {};
            }
            var invisible = state_changes.invisible;
            if (invisible === undefined) {
                invisible = this.attributes.invisible;
            }
            if (invisible) {
                this.hide();
            } else {
                this.show();
            }
        },
        show: function() {
            this.el.show();
        },
        hide: function() {
            this.el.hide();
        }
    });

    Sao.View.Form.LabelMixin = Sao.class_(Sao.View.Form.StateWidget, {
        set_state: function(record) {
            Sao.View.Form.LabelMixin._super.set_state.call(this, record);
            var field;
            if (this.attributes.name && record) {
                field = record.model.fields[this.attributes.name];
            }
            if (!((this.attributes.string === undefined) ||
                this.attributes.string) && field) {
                var text = '';
                if (record) {
                    text = field.get_client(record) || '';
                }
                this.label_el.text(text);
            }
            var state_changes;
            if (record) {
                state_changes = record.expr_eval(this.attributes.states || {});
            } else {
                state_changes = {};
            }
            if (state_changes.readonly === undefined) {
                state_changes.readonly = !field;
            }
            Sao.common.apply_label_attributes(
                    this.label_el,
                    ((field && field.description.readonly) ||
                     state_changes.readonly),
                    ((field && field.description.required) ||
                     state_changes.required));
        }
    });

    Sao.View.Form.Separator = Sao.class_(Sao.View.Form.LabelMixin, {
        init: function(text, attributes) {
            Sao.View.Form.Separator._super.init.call(this, attributes);
            this.el = jQuery('<div/>', {
                'class': 'form-separator'
            });
            this.label_el = jQuery('<label/>');
            if (text) {
                this.label_el.text(text);
            }
            this.el.append(this.label_el);
            this.el.append(jQuery('<hr/>'));
        }
    });

    Sao.View.Form.Label = Sao.class_(Sao.View.Form.LabelMixin, {
        class_: 'form-label',
        init: function(text, attributes) {
            Sao.View.Form.Label._super.init.call(this, attributes);
            this.el = this.label_el = jQuery('<label/>', {
                text: text,
                'class': this.class_
            });
        }
    });

    Sao.View.Form.Notebook = Sao.class_(Sao.View.Form.StateWidget, {
        class_: 'form-notebook',
        init: function(attributes) {
            Sao.View.Form.Notebook._super.init.call(this, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.nav = jQuery('<ul/>', {
                'class': 'nav nav-tabs',
                role: 'tablist'
            }).appendTo(this.el);
            this.panes = jQuery('<div/>', {
                'class': 'tab-content'
            }).appendTo(this.el);
            this.selected = false;
        },
        add: function(tab, text, icon) {
            var pane = jQuery('<div/>', {
                'role': 'tabpanel',
                'class': 'tab-pane',
            }).uniqueId();
            var tab_id = pane.attr('id');
            var img = Sao.common.ICONFACTORY.get_icon_img(icon);
            var page = jQuery('<li/>', {
                'role': 'presentation'
            }).append(
                jQuery('<a/>', {
                    'aria-controls': tab_id,
                    'role': 'tab',
                    'data-toggle': 'tab',
                    'href': '#' + tab_id
                })
                .append(img)
                .append(text))
                .appendTo(this.nav);
            pane.html(tab).appendTo(this.panes);
            if (!this.selected) {
                // Can not use .tab('show')
                page.addClass('active');
                pane.addClass('active');
                this.selected = true;
            }
            return page;
        },
        set_current_page: function(page_index) {
            var selector;
            if (page_index === undefined) {
                selector = ':visible:first';
            } else {
                selector = ':eq(' + page_index + '):visible';
            }
            var tab = this.nav.find('li' + selector + ' a');
            tab.tab('show');
        },
        get_n_pages: function() {
            return this.nav.find("li[role='presentation']").length;
        },
        get_nth_page: function(page_index) {
            return jQuery(this.panes.find("div[role='tabpanel']")[page_index]);
        }
    });

    Sao.View.Form.Page = Sao.class_(Sao.View.Form.StateWidget, {
        init: function(el, attributes) {
            Sao.View.Form.Page._super.init.call(this, attributes);
            this.el = el;
        },
        hide: function() {
            Sao.View.Form.Page._super.hide.call(this);
            if (this.el.hasClass('active')) {
                this.el.next(':visible').find('a').tab('show');
            }
        }
    });

    Sao.View.Form.Group = Sao.class_(Sao.View.Form.StateWidget, {
        class_: 'form-group_',
        init: function(attributes) {
            Sao.View.Form.Group._super.init.call(this, attributes);
            this.el = jQuery('<fieldset/>', {
                'class': this.class_
            });
            if (attributes.string) {
                this.el.append(jQuery('<legend/>').text(attributes.string));
            }
        },
        add: function(widget) {
            this.el.append(widget.el);
        }
    });

    Sao.View.Form.Expander = Sao.class_(Sao.View.Form.StateWidget, {
        class_: 'form-group-expandable',
        init: function(attributes) {
            Sao.View.Form.Expander._super.init.call(this, attributes);
            this.el = jQuery('<div/>', {
                'class': 'panel panel-default ' + this.class_
            });
            var heading = jQuery('<div/>', {
                'class': 'panel-heading',
            }).appendTo(this.el);
            heading.uniqueId();

            this.collapsible = jQuery('<div/>', {
                'class': 'panel-collapse collapse',
                'aria-labelledby': heading.attr('id'),
            }).appendTo(this.el);
            this.collapsible.uniqueId();
            this.body = jQuery('<div/>', {
                'class': 'panel-body',
            }).appendTo(this.collapsible);

            var title = jQuery('<label/>', {
                'class': 'panel-title',
            }).appendTo(heading);
            var link = jQuery('<a/>', {
                'role': 'button',
                'data-toggle': 'collapse',
                'href': '#' + this.collapsible.attr('id'),
                'aria-controls': this.collapsible.attr('id'),
                'aria-expanded': attributes.expandable == '1',
            }).appendTo(title);
            link.append(jQuery('<div/>', {
                'class': 'btn btn-sm',
            }).append(jQuery('<span/>', {
                'class': 'caret',
            })));
            if (attributes.string) {
                link.append(attributes.string);
            }
        },
        add: function(widget) {
            this.body.empty();
            this.body.append(widget.el);
        },
        set_expanded: function(expanded) {
            if (expanded) {
                this.collapsible.collapse('show');
            } else {
                this.collapsible.collapse('hide');
            }
        }
    });

    Sao.View.Form.Image_ = Sao.class_(Sao.View.Form.StateWidget, {
        class_: 'form-image_',
        init: function(attributes) {
            Sao.View.Form.Image_._super.init.call(this, attributes);
            this.el = jQuery('<div/>', {
                'class_': this.class_
            });
            this.img = jQuery('<img/>', {
                'class': 'center-block',
                'width': (attributes.size || 48) + 'px',
                'height': (attributes.size || 48) + 'px',
            }).appendTo(this.el);
        },
        set_state: function(record) {
            Sao.View.Form.Image_._super.set_state.call(this, record);
            if (!record) {
                return;
            }
            var name = this.attributes.name;
            if (name in record.model.fields) {
                var field = record.model.fields[name];
                name = field.get(record);
            }
            Sao.common.ICONFACTORY.get_icon_url(name)
                .done(function(url) {
                    this.img.attr('src', url);
                }.bind(this));
        }
    });

    Sao.View.Form.Widget = Sao.class_(Object, {
        expand: false,
        init: function(view, attributes) {
            this.view = view;
            this.attributes = attributes;
            this.el = null;
            this.position = 0;
            this.visible = true;
            this.labelled = null;  // Element which received the labelledby
        },
        display: function() {
            var field = this.field;
            var record = this.record;
            var readonly = this.attributes.readonly;
            var invisible = this.attributes.invisible;
            var required = this.attributes.required;
            if (!field) {
                if (readonly === undefined) {
                    readonly = true;
                }
                if (invisible === undefined) {
                    invisible = false;
                }
                if (required === undefined) {
                    required = false;
                }
                this.set_readonly(readonly);
                this.set_invisible(invisible);
                this.set_required(required);
                return;
            }
            var state_attrs = field.get_state_attrs(record);
            if (readonly === undefined) {
                readonly = state_attrs.readonly;
                if (readonly === undefined) {
                    readonly = false;
                }
            }
            if (required === undefined) {
                required = state_attrs.required;
                if (required === undefined) {
                    required = false;
                }
            }
            if (this.view.screen.attributes.readonly) {
                readonly = true;
            }
            this.set_readonly(readonly);
            if (readonly) {
                this.el.addClass('readonly');
            } else {
                this.el.removeClass('readonly');
            }
            var required_el = this._required_el();
            this.set_required(required);
            if (!readonly && required) {
                required_el.addClass('required');
            } else {
                required_el.removeClass('required');
            }
            var invalid = state_attrs.invalid;
            var invalid_el = this._invalid_el();
            if (!readonly && invalid) {
                invalid_el.addClass('has-error');
            } else {
                invalid_el.removeClass('has-error');
            }
            if (invisible === undefined) {
                invisible = field.get_state_attrs(this.record).invisible;
                if (invisible === undefined) {
                    invisible = false;
                }
            }
            this.set_invisible(invisible);
        },
        _required_el: function () {
            return this.el;
        },
        _invalid_el: function() {
            return this.el;
        },
        get field_name() {
            return this.attributes.name;
        },
        get model_name() {
            return this.view.screen.model_name;
        },
        get model() {
            return this.view.screen.model;
        },
        get record() {
            return this.view.record;
        },
        get field() {
            var record = this.record;
            if (record) {
                return record.model.fields[this.field_name];
            }
        },
        focus_out: function() {
            if (!this.field) {
                return;
            }
            if (!this.visible) {
                return;
            }
            this.set_value();
        },
        set_value: function() {
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this.el.prop('disabled', readonly);
        },
        set_required: function(required) {
        },
        set_invisible: function(invisible) {
            this.visible = !invisible;
            if (invisible) {
                this.el.hide();
            } else {
                this.el.show();
            }
        },
        focus: function() {
            this.el.focus();
        },
    });

    Sao.View.Form.TranslateDialog = Sao.class_(Object,  {
        class_: 'form',
        init: function(languages, widget) {
            var dialog = new Sao.Dialog(
                Sao.i18n.gettext('Translate'), this.class_, 'lg');
            this.languages = languages;
            this.read(widget, dialog);
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.close(dialog);
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('OK')).click(this.write
                    .bind(this, widget, dialog))
                    .appendTo(dialog.footer);
            dialog.content.submit(function(evt) {
                evt.preventDefault();
                dialog.footer.find('button.btn-primary').first().click();
            });
            dialog.modal.modal('show');
            dialog.modal.on('shown.bs.modal', function() {
                dialog.modal.find('input,select')
                    .filter(':visible').first().focus();
            });
        },
        close: function(dialog) {
            dialog.modal.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
            dialog.modal.modal('hide');
        },
        read: function(widget, dialog) {
            function field_value(result) {
                return result[0][widget.field_name] || '';
            }
            this.languages.forEach(function(lang){
                var value;
                var row = jQuery('<div/>', {
                    'class':'row form-group'
                });
                var input = widget.translate_widget();
                input.attr('data-lang-id', lang.id);
                var checkbox = jQuery('<input/>', {
                    'type':'checkbox',
                    'title': Sao.i18n.gettext('Edit')
                });
                if (widget._readonly) {
                    checkbox.attr('disabled', true);
                }
                var fuzzy_box = jQuery('<input/>', {
                    'type':'checkbox',
                    'disabled': true,
                    'title': Sao.i18n.gettext('Fuzzy')
                });
                var prm1 = Sao.rpc({
                    'method': 'model.' + widget.model.name  + '.read',
                    'params': [
                        [widget.record.id],
                        [widget.field_name],
                        {language: lang.code},
                    ],
                }, widget.model.session).then(field_value);
                var prm2 = Sao.rpc({
                    'method': 'model.' + widget.model.name  + '.read',
                    'params': [
                        [widget.record.id],
                        [widget.field_name],
                        {
                            language: lang.code,
                            fuzzy_translation: true,
                        },
                    ],
                }, widget.model.session).then(field_value);

                jQuery.when(prm1, prm2).done(function(value, fuzzy_value) {
                    widget.translate_widget_set(input, fuzzy_value);
                    widget.translate_widget_set_readonly( input, true);
                    fuzzy_box.attr('checked', value !== fuzzy_value);
                });
                checkbox.click(function() {
                    widget.translate_widget_set_readonly(
                        input, !jQuery(this).prop('checked'));
                });
                dialog.body.append(row);
                row.append(jQuery('<div/>', {
                    'class':'col-sm-2'
                }).append(lang.name));
                row.append(jQuery('<div/>', {
                    'class':'col-sm-8'
                }).append(input));
                row.append(jQuery('<div/>', {
                    'class':'col-sm-1'
                }).append(checkbox));
                row.append(jQuery('<div/>', {
                    'class':'col-sm-1'
                }).append(fuzzy_box));
            }.bind(this));
        },
        write: function(widget, dialog) {
            this.languages.forEach(function(lang) {
                var input = jQuery('[data-lang-id=' + lang.id + ']');
                if (!input.attr('readonly')) {
                    var current_language = widget.model.session.context.
                            language;
                    var context = {};
                    context.language = lang.code;
                    context.fuzzy_translation = false;
                    var values =  {};
                    values[widget.field_name] = widget.translate_widget_get(input);
                    var params = [
                        [widget.record.id],
                        values,
                        context
                    ];
                    var args = {
                        'method': 'model.' + widget.model.name  + '.write',
                        'params': params
                    };
                    Sao.rpc(args, widget.model.session, false);
                }
            }.bind(this));
            widget.record.cancel();
            widget.view.display();
            this.close(dialog);
        }
    });

    Sao.View.Form.TranslateMixin = {};
    Sao.View.Form.TranslateMixin.init = function() {
        if (!this.translate) {
            this.translate = Sao.View.Form.TranslateMixin.translate.bind(this);
        }
        if (!this.translate_dialog) {
            this.translate_dialog =
                Sao.View.Form.TranslateMixin.translate_dialog.bind(this);
        }
        if (!this.translate_widget_set_readonly) {
            this.translate_widget_set_readonly =
                Sao.View.Form.TranslateMixin.translate_widget_set_readonly
                    .bind(this);
        }
        if (!this.translate_widget_set) {
            this.translate_widget_set =
                Sao.View.Form.TranslateMixin.translate_widget_set.bind(this);
        }
        if (!this.translate_widget_get) {
            this.translate_widget_get =
                Sao.View.Form.TranslateMixin.translate_widget_get.bind(this);
        }
    };
    Sao.View.Form.TranslateMixin.translate = function() {
        if (this.record.id < 0 || this.record.has_changed()) {
            var mg = Sao.i18n.gettext(
                'You need to save the record before adding translations.');
            Sao.common.message.run(mg);
            return;
        }
        var session = this.model.session;
        var params = [
            [['translatable', '=', true]]
        ];
        var args = {
            'method': 'model.ir.lang.search',
            'params': params.concat({})
        };
        Sao.rpc(args, session).then(function(lang_ids) {
            if (jQuery.isEmptyObject(lang_ids)) {
                Sao.common.message.run(Sao.i18n.gettext(
                        'No other language available.'));
                return;
            }
            var params = [
                lang_ids,
                ['code', 'name']
            ];
            var args = {
                'method': 'model.ir.lang.read',
                'params': params.concat({})
            };
            Sao.rpc(args, session).then(function(languages) {
                this.translate_dialog(languages);
            }.bind(this));
        }.bind(this));
    };
    Sao.View.Form.TranslateMixin.translate_dialog = function(languages) {
        new Sao.View.Form.TranslateDialog(languages, this);
    };
    Sao.View.Form.TranslateMixin.translate_widget_set_readonly =
            function(el, value) {
        el.prop('readonly', value);
    };
    Sao.View.Form.TranslateMixin.translate_widget_set = function(el, value) {
        el.val(value);
    };
    Sao.View.Form.TranslateMixin.translate_widget_get = function(el) {
        return el.val();
    };

    Sao.View.Form.Char = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-char',
        init: function(view, attributes) {
            Sao.View.Form.Char._super.init.call(this, view, attributes);
            Sao.View.Form.TranslateMixin.init.call(this);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.group = jQuery('<div/>', {
                'class': 'input-group input-group-sm'
            }).appendTo(this.el);
            this.input = this.labelled = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control input-sm mousetrap'
            }).appendTo(this.group);
            if (!jQuery.isEmptyObject(attributes.autocomplete)) {
                this.datalist = jQuery('<datalist/>').appendTo(this.el);
                this.datalist.uniqueId();
                this.input.attr('list', this.datalist.attr('id'));
                // workaround for
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1474137
                this.input.attr('autocomplete', 'off');
            }
            this.el.change(this.focus_out.bind(this));

            if (!attributes.size) {
                this.group.css('width', '100%');
            }
            if (this.attributes.translate) {
                Sao.common.ICONFACTORY.get_icon_img('tryton-translate')
                    .appendTo(jQuery('<div/>', {
                        'class': 'icon-input icon-secondary',
                        'aria-label': Sao.i18n.gettext('Translate'),
                        'title': Sao.i18n.gettext('Translate'),
                    }).appendTo(
                        this.group.addClass('input-icon input-icon-secondary')))
                .click(this.translate.bind(this));
            }
        },
        get_client_value: function() {
            var field = this.field;
            var record = this.record;
            var value = '';
            if (field) {
                value = field.get_client(record);
            }
            return value;
        },
        display: function() {
            Sao.View.Form.Char._super.display.call(this);

            var record = this.record;
            if (this.datalist) {
                this.datalist.children().remove();
                var set_autocompletion = function() {
                    var selection = [];
                    if (record) {
                        selection = record.autocompletion[this.field_name] || [];
                    }
                    selection.forEach(function(e) {
                        jQuery('<option/>', {
                            'value': e
                        }).appendTo(this.datalist);
                    }.bind(this));
                }.bind(this);
                if (record && !(this.field_name in record.autocompletion)) {
                    record.do_autocomplete(this.field_name).done(set_autocompletion);
                } else {
                    set_autocompletion();
                }
            }

            // Set size
            var length = '';
            var width = '100%';
            if (record) {
                length = record.expr_eval(this.attributes.size);
                if (length > 0) {
                    width = null;
                }
            }
            this.input.val(this.get_client_value());
            this.input.attr('maxlength', length);
            this.input.attr('size', length);
            this.group.css('width', width);
        },
        set_value: function() {
            this.field.set_client(this.record, this.input.val());
        },
        set_readonly: function(readonly) {
            this.input.prop('readonly', readonly);
        },
        focus: function() {
            this.input.focus();
        },
        translate_widget: function() {
            return jQuery('<input/>', {
                'class': 'form-control',
                'readonly': 'readonly'
            });
        }
    });

    Sao.View.Form.Password = Sao.class_(Sao.View.Form.Char, {
        class_: 'form-password',
        init: function(view, attributes) {
            Sao.View.Form.Password._super.init.call(this, view, attributes);
            this.input.prop('type', 'password');
            this.button = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm form-control',
                'type': 'button'
            }).appendTo(jQuery('<span/>', {
                'class': 'input-group-btn'
            }).appendTo(this.group));
            this._set_password_label();
            this.button.click(this.toggle_visibility.bind(this));

        },
        toggle_visibility: function() {
            if (this.input.prop('type') == 'password') {
                this.input.prop('type', 'text');
                this.input.attr('autocomplete', 'off');
            } else {
                this.input.prop('type', 'password');
                this.input.removeAttr('autocomplete');
            }
            this._set_password_label();
        },
        _set_password_label: function() {
            if (this.input.prop('type') == 'password') {
                this.button.text(Sao.i18n.gettext('Show'));
            } else {
                this.button.text(Sao.i18n.gettext('Hide'));
            }
        }
    });

    Sao.View.Form.Date = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-date',
        _width: '10em',
        init: function(view, attributes) {
            Sao.View.Form.Date._super.init.call(this, view, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.date = this.labelled = jQuery('<div/>', {
                'class': ('input-group input-group-sm ' +
                    'input-icon input-icon-primary'),
            }).appendTo(this.el);
            Sao.common.ICONFACTORY.get_icon_img('tryton-date')
                .appendTo(jQuery('<div/>', {
                    'class': 'datepickerbutton icon-input icon-primary',
                    'aria-label': Sao.i18n.gettext("Open the calendar"),
                    'title': Sao.i18n.gettext("Open the calendar"),
                }).appendTo(this.date));
            this.input = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control input-sm mousetrap'
            }).appendTo(this.date);
            this.date.datetimepicker({
                'locale': moment.locale(),
                'keyBinds': null,
            });
            this.date.css('max-width', this._width);
            this.date.on('dp.change', this.focus_out.bind(this));
            // We must set the overflow of the treeview and modal-body
            // containing the input to visible to prevent vertical scrollbar
            // inherited from the auto overflow-x
            // (see http://www.w3.org/TR/css-overflow-3/#overflow-properties)
            this.date.on('dp.hide', function() {
                this.date.closest('.treeview').css('overflow', '');
                this.date.closest('.modal-body').css('overflow', '');
            }.bind(this));
            this.date.on('dp.show', function() {
                this.date.closest('.treeview').css('overflow', 'visible');
                this.date.closest('.modal-body').css('overflow', 'visible');
            }.bind(this));
            var mousetrap = new Mousetrap(this.el[0]);

            mousetrap.bind('enter', function(e, combo) {
                if (!this.date.find('input').prop('readonly')) {
                    this.date.data('DateTimePicker').date();
                }
            }.bind(this));
            mousetrap.bind('=', function(e, combo) {
                if (!this.date.find('input').prop('readonly')) {
                    e.preventDefault();
                    this.date.data('DateTimePicker').date(moment());
                }
            }.bind(this));

            Sao.common.DATE_OPERATORS.forEach(function(operator) {
                mousetrap.bind(operator[0], function(e, combo) {
                    if (this.date.find('input').prop('readonly')) {
                        return;
                    }
                    e.preventDefault();
                    var dp = this.date.data('DateTimePicker');
                    var date = dp.date();
                    date.add(operator[1]);
                    dp.date(date);
                }.bind(this));
            }.bind(this));
        },
        get_format: function() {
            return this.field.date_format(this.record);
        },
        get_value: function() {
            var value = this.date.data('DateTimePicker').date();
            if (value) {
                value.isDate = true;
            }
            return value;
        },
        display: function() {
            var record = this.record;
            var field = this.field;
            if (record && field) {
                this.date.data('DateTimePicker').format(
                    Sao.common.moment_format(this.get_format()));
            }
            Sao.View.Form.Date._super.display.call(this);
            var value;
            if (record) {
                value = field.get_client(record);
            } else {
                value = null;
            }
            this.date.off('dp.change');
            try {
                this.date.data('DateTimePicker').date(value);
            } finally {
                this.date.on('dp.change', this.focus_out.bind(this));
            }
        },
        focus: function() {
            this.input.focus();
        },
        set_value: function() {
            this.field.set_client(this.record, this.get_value());
        },
        set_readonly: function(readonly) {
            this.date.find('button').prop('disabled', readonly);
            this.date.find('input').prop('readonly', readonly);
        }
    });

    Sao.View.Form.DateTime = Sao.class_(Sao.View.Form.Date, {
        class_: 'form-datetime',
        _width: '20em',
        get_format: function() {
            var record = this.record;
            var field = this.field;
            return field.date_format(record) + ' ' + field.time_format(record);
        },
        get_value: function() {
            var value = this.date.data('DateTimePicker').date();
            if (value) {
                value.isDateTime = true;
            }
            return value;
        }
    });

    Sao.View.Form.Time = Sao.class_(Sao.View.Form.Date, {
        class_: 'form-time',
        _width: '10em',
        get_format: function() {
            return this.field.time_format(this.record);
        },
        get_value: function() {
            var value = this.date.data('DateTimePicker').date();
            if (value) {
                value.isTime = true;
            }
            return value;
        }
    });

    Sao.View.Form.TimeDelta = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-timedelta',
        init: function(view, attributes) {
            Sao.View.Form.TimeDelta._super.init.call(this, view, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.input = this.labelled = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control input-sm mousetrap'
            }).appendTo(this.el);
            this.el.change(this.focus_out.bind(this));
        },
        display: function() {
            Sao.View.Form.TimeDelta._super.display.call(this);
            var record = this.record;
            if (record) {
                var value = record.field_get_client(this.field_name);
                this.input.val(value || '');
            } else {
                this.input.val('');
            }
        },
        focus: function() {
            this.input.focus();
        },
        set_value: function() {
            this.field.set_client(this.record, this.input.val());
        },
        set_readonly: function(readonly) {
            this.input.prop('readonly', readonly);
        }
    });

    var integer_input = function(input) {
        var input_text = input.clone().prependTo(input.parent());
        input_text.attr('type', 'text');
        input.attr('type', 'number');
        input.attr('step', 1);
        input.attr('lang', Sao.i18n.getlang());

        input.hide().on('focusout', function() {
            if (input[0].checkValidity()) {
                input.hide();
                input_text.show();
            }
        });
        input_text.on('focusin', function() {
            if (!input.prop('readonly')) {
                input_text.hide();
                input.show();
                window.setTimeout(function() {
                    input.focus();
                });
            }
        });
        return input_text;
    };

    Sao.View.Form.Integer = Sao.class_(Sao.View.Form.Char, {
        class_: 'form-integer',
        init: function(view, attributes) {
            Sao.View.Form.Integer._super.init.call(this, view, attributes);
            this.input_text = integer_input(this.input);
            this.group.css('width', '');
            this.factor = Number(attributes.factor || 1);
        },
        set_value: function() {
            this.field.set_client(
                this.record, this.get_value(), undefined, this.factor);
        },
        get_value: function() {
            return this.input.val();
        },
        get_client_value: function() {
            var value = '';
            var field = this.field;
            if (field) {
                value = field.get(this.record);
                if (value !== null) {
                    value *= this.factor;
                }
            }
            return value;
        },
        display: function() {
            Sao.View.Form.Integer._super.display.call(this);
            var field = this.field;
            var value = '';
            if (field) {
                value = field.get_client(this.record, this.factor);
            }
            this.input_text.val(value);
            this.input_text.attr('maxlength', this.input.attr('maxlength'));
            this.input_text.attr('size', this.input.attr('size'));
        },
        set_readonly: function(readonly) {
            Sao.View.Form.Integer._super.set_readonly.call(this, readonly);
            this.input_text.prop('readonly', readonly);
        },
        focus: function() {
            if (!this.input.prop('readonly')) {
                this.input_text.hide();
                this.input.show().focus();
            } else {
                this.input_text.focus();
            }
        }
    });

    Sao.View.Form.Float = Sao.class_(Sao.View.Form.Integer, {
        class_: 'form-float',
        display: function() {
            var record = this.record;
            var field = this.field;
            var step = 'any';
            if (record) {
                var digits = field.digits(record, this.factor);
                if (digits) {
                    step = Math.pow(10, -digits[1]).toFixed(digits[1]);
                }
            }
            this.input.attr('step', step);
            Sao.View.Form.Float._super.display.call(this);
        }
    });

    Sao.View.Form.Selection = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-selection',
        init: function(view, attributes) {
            Sao.View.Form.Selection._super.init.call(this, view, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.select = this.labelled = jQuery('<select/>', {
                'class': 'form-control input-sm mousetrap'
            });
            this.el.append(this.select);
            this.select.change(this.focus_out.bind(this));
            Sao.common.selection_mixin.init.call(this);
            this.init_selection();
        },
        init_selection: function(key) {
            Sao.common.selection_mixin.init_selection.call(this, key,
                this.set_selection.bind(this));
        },
        update_selection: function(record, field, callbak) {
            Sao.common.selection_mixin.update_selection.call(this, record,
                field, function(selection) {
                    this.set_selection(selection);
                    if (callbak) {
                        callbak();
                    }
                }.bind(this));
        },
        set_selection: function(selection) {
            var select = this.select;
            select.empty();
            selection.forEach(function(e) {
                select.append(jQuery('<option/>', {
                    'value': JSON.stringify(e[0]),
                    'text': e[1]
                }));
            });
        },
        display_update_selection: function() {
            var record = this.record;
            var field = this.field;
            this.update_selection(record, field, function() {
                if (!field) {
                    this.select.val('');
                    return;
                }
                var value = field.get(record);
                var prm, found = false;
                for (var i = 0, len = this.selection.length; i < len; i++) {
                    if (this.selection[i][0] === value) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    prm = Sao.common.selection_mixin.get_inactive_selection
                        .call(this, value);
                    prm.done(function(inactive) {
                        this.select.append(jQuery('<option/>', {
                            value: JSON.stringify(inactive[0]),
                            text: inactive[1],
                            disabled: true
                        }));
                    }.bind(this));
                } else {
                    prm = jQuery.when();
                }
                prm.done(function() {
                    this.select.val(JSON.stringify(value));
                }.bind(this));
            }.bind(this));
        },
        display: function() {
            Sao.View.Form.Selection._super.display.call(this);
            this.display_update_selection();
        },
        focus: function() {
            this.select.focus();
        },
        value_get: function() {
            return JSON.parse(this.select.val());
        },
        set_value: function() {
            var value = this.value_get();
            this.field.set_client(this.record, value);
        },
        set_readonly: function(readonly) {
            this.select.prop('disabled', readonly);
        }
    });

    Sao.View.Form.Boolean = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-boolean',
        init: function(view, attributes) {
            Sao.View.Form.Boolean._super.init.call(this, view, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.input = this.labelled = jQuery('<input/>', {
                'type': 'checkbox',
                'class': 'form-control input-sm mousetrap'
            }).appendTo(this.el);
            this.input.change(this.focus_out.bind(this));
            this.input.click(function() {
                // Dont trigger click if field is readonly as readonly has no
                // effect on checkbox
                return !jQuery(this).prop('readonly');
            });
        },
        display: function() {
            Sao.View.Form.Boolean._super.display.call(this);
            var record = this.record;
            if (record) {
                this.input.prop('checked', record.field_get(this.field_name));
            } else {
                this.input.prop('checked', false);
            }
        },
        focus: function() {
            this.input.focus();
        },
        set_value: function() {
            var value = this.input.prop('checked');
            this.field.set_client(this.record, value);
        },
        set_readonly: function(readonly) {
            this.input.prop('readonly', readonly);
        }
    });

    Sao.View.Form.Text = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-text',
        expand: true,
        init: function(view, attributes) {
            Sao.View.Form.Text._super.init.call(this, view, attributes);
            Sao.View.Form.TranslateMixin.init.call(this);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            this.input = this.labelled = jQuery('<textarea/>', {
                'class': 'form-control input-sm mousetrap'
            }).appendTo(this.el);
            this.input.change(this.focus_out.bind(this));
            if (this.attributes.translate) {
                var button  = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm form-control',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Translate')
                }).appendTo(jQuery('<span/>', {
                    'class': 'input-group-btn'
                }).appendTo(this.el));
                button.append(
                    Sao.common.ICONFACTORY.get_icon_img('tryton-translate'));
                button.click(this.translate.bind(this));
            }
        },
        display: function() {
            Sao.View.Form.Text._super.display.call(this);
            var record = this.record;
            if (record) {
                var value = record.field_get_client(this.field_name);
                this.input.val(value);
                if(this.attributes.spell) {
                    this.input.attr('lang',
                        Sao.i18n.BC47(record.expr_eval(this.attributes.spell)));
                    this.input.attr('spellcheck', 'true');
                }
            } else {
                this.input.val('');
            }
        },
        focus: function() {
            this.input.focus();
        },
        set_value: function() {
            var value = this.input.val() || '';
            this.field.set_client(this.record, value);
        },
        set_readonly: function(readonly) {
            this.input.prop('readonly', readonly);
        },
        translate_widget: function() {
            return jQuery('<textarea/>', {
                    'class': 'form-control',
                    'readonly': 'readonly'
                });
        }
    });

    Sao.View.Form.RichText = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-richtext',
        expand: true,
        init: function(view, attributes) {
            Sao.View.Form.RichText._super.init.call(this, view, attributes);
            Sao.View.Form.TranslateMixin.init.call(this);
            this.el = jQuery('<div/>', {
                'class': this.class_ + ' panel panel-default'
            });
            if (parseInt(attributes.toolbar || '1', 10)) {
                this.toolbar = this.get_toolbar().appendTo(this.el);
            }
            this.input = this.labelled = jQuery('<div/>', {
                'class': 'richtext mousetrap',
                'contenteditable': true
            }).appendTo(jQuery('<div/>', {
                'class': 'panel-body'
            }).appendTo(this.el));
            this.el.focusout(this.focus_out.bind(this));
            if (this.attributes.translate) {
                var button = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm form-control',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext("Translate"),
                }).appendTo(jQuery('<span/>', {
                    'class': 'input-group-btn',
                }).appendTo(this.el));
                button.append(
                    Sao.common.ICONFACTORY.get_icon_img('tryton-translate'));
                button.click(this.translate.bind(this));
            }
        },
        get_toolbar: function() {
            var i, properties, button;
            var toolbar = jQuery('<div/>', {
                'class': 'btn-toolbar',
                'role': 'toolbar'
            }).appendTo(jQuery('<div/>', {
                'class': 'panel-heading'
            }));

            var button_apply_command = function(evt) {
                document.execCommand(evt.data);
            };

            var add_buttons = function(buttons) {
                var group = jQuery('<div/>', {
                    'class': 'btn-group',
                    'role': 'group'
                }).appendTo(toolbar);
                for (i in buttons) {
                    properties = buttons[i];
                    button = jQuery('<button/>', {
                        'class': 'btn btn-default',
                        'type': 'button'
                    }).append(Sao.common.ICONFACTORY.get_icon_img(
                        'tryton-format-' + properties.icon)
                    ).appendTo(group);
                    button.click(properties.command, button_apply_command);
                }
            };

            add_buttons([
                    {
                        'icon': 'bold',
                        'command': 'bold'
                    }, {
                        'icon': 'italic',
                        'command': 'italic'
                    }, {
                        'icon': 'underline',
                        'command': 'underline'
                    }]);

            var selections = [
            {
                'heading': Sao.i18n.gettext('Font'),
                'options': ['Normal', 'Serif', 'Sans', 'Monospace'],  // XXX
                'command': 'fontname'
            }, {
                'heading': Sao.i18n.gettext('Size'),
                'options': [1, 2, 3, 4, 5, 6, 7],
                'command': 'fontsize'
            }];
            var add_option = function(dropdown, properties) {
                return function(option) {
                    dropdown.append(jQuery('<li/>').append(jQuery('<a/>', {
                        'href': '#'
                    }).append(option).click(function(evt) {
                        evt.preventDefault();
                        document.execCommand(properties.command, false, option);
                    })));
                };
            };
            for (i in selections) {
                properties = selections[i];
                var group = jQuery('<div/>', {
                    'class': 'btn-group',
                    'role': 'group'
                }).appendTo(toolbar);
                button = jQuery('<button/>', {
                    'class': 'btn btn-default dropdown-toggle',
                    'type': 'button',
                    'data-toggle': 'dropdown',
                    'aria-expanded': false,
                    'aria-haspopup': true
                }).append(properties.heading)
                .append(jQuery('<span/>', {
                    'class': 'caret'
                })).appendTo(group);
                var dropdown = jQuery('<ul/>', {
                    'class': 'dropdown-menu'
                }).appendTo(group);
                properties.options.forEach(add_option(dropdown, properties));
            }

            add_buttons([
                    {
                        'icon': 'align-left',
                        'command': Sao.i18n.rtl? 'justifyRight' : 'justifyLeft',
                    }, {
                        'icon': 'align-center',
                        'command': 'justifyCenter'
                    }, {
                        'icon': 'align-right',
                        'command': Sao.i18n.rtl? 'justifyLeft': 'justifyRight',
                    }, {
                        'icon': 'align-justify',
                        'command': 'justifyFull'
                    }]);

            // TODO backColor
            [['foreColor', '#000000']].forEach(
                    function(e) {
                        var command = e[0];
                        var color = e[1];
                        jQuery('<input/>', {
                            'class': 'btn btn-default',
                            'type': 'color'
                        }).appendTo(toolbar)
                        .change(function() {
                            document.execCommand(command, false, jQuery(this).val());
                        }).focusin(function() {
                            document.execCommand(command, false, jQuery(this).val());
                        }).val(color);
            });
            return toolbar;
        },
        focus_out: function() {
            // Let browser set the next focus before testing
            // if it moved out of the widget
            window.setTimeout(function() {
                if (this.el.find(':focus').length === 0) {
                    Sao.View.Form.RichText._super.focus_out.call(this);
                }
            }.bind(this), 0);
        },
        display: function() {
            Sao.View.Form.RichText._super.display.call(this);
            var value = '';
            var record = this.record;
            if (record) {
                value = record.field_get_client(this.field_name);
                if(this.attributes.spell) {
                    this.input.attr('lang',
                        Sao.i18n.BC47(record.expr_eval(this.attributes.spell)));
                    this.input.attr('spellcheck', 'true');
                }
            }
            this.input.html(value);
        },
        focus: function() {
            this.input.focus();
        },
        get_value: function() {
            return this._normalize_markup(this.input.html());
        },
        set_value: function() {
            // avoid modification of not normalized value
            var value = this.get_value();
            var prev_value  = this.field.get_client(this.record);
            if (value == this._normalize_markup(prev_value)) {
                value = prev_value;
            }
            this.field.set_client(this.record, value);
        },
        _normalize_markup: function(content) {
            var el = jQuery('<div/>').html(content || '');
            this._normalize(el);
            return el.html();
        },
        _normalize: function(el) {
            // TODO order attributes
            el.find('div').each(function(i, el) {
                el = jQuery(el);
                // Not all browsers respect the styleWithCSS
                if (el.css('text-align')) {
                    // Remove browser specific prefix
                    var align = el.css('text-align').split('-').pop();
                    el.attr('align', align);
                    el.css('text-align', '');
                }
                // Some browsers set start as default align
                if (el.attr('align') == 'start') {
                    if (Sao.i18n.rtl) {
                        el.attr('align', 'right');
                    } else {
                        el.attr('align', 'left');
                    }
                }
            });
        },
        set_readonly: function(readonly) {
            this.input.prop('contenteditable', !readonly);
            if (this.toolbar) {
                this.toolbar.find('button,input,select')
                    .prop('disabled', readonly);
            }
        },
        translate_widget: function() {
            var widget = jQuery('<div/>', {
                'class': this.class_ + ' panel panel-default',
            });
            if (parseInt(this.attributes.toolbar || '1', 10)) {
                this.get_toolbar().appendTo(widget);
            }
            var input = jQuery('<div/>', {
                'class': 'richtext mousetrap',
                'contenteditable': true
            }).appendTo(jQuery('<div/>', {
                'class': 'panel-body'
            }).appendTo(widget));
            return widget;
        },
        translate_widget_set_readonly: function(el, value) {
            Sao.View.Form.TranslateMixin.translate_widget_set_readonly.call(
                this, el, value);
            el.find('button,input,select').prop('disabled', value);
            el.find('div[contenteditable]').prop('contenteditable', !value);
        },
        translate_widget_set: function(el, value) {
            el.find('div[contenteditable]').html(value);
        },
        translate_widget_get: function(el) {
            var input = el.find('div[contenteditable]');
            this._normalize(input);
            return input.html();
        }
    });

    Sao.View.Form.Many2One = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-many2one',
        init: function(view, attributes) {
            Sao.View.Form.Many2One._super.init.call(this, view, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            var group = jQuery('<div/>', {
                'class': 'input-group input-group-sm input-icon'
            }).appendTo(this.el);
            this.entry = this.labelled = jQuery('<input/>', {
                'type': 'input',
                'class': 'form-control input-sm mousetrap'
            }).appendTo(group);
            this.but_primary = jQuery('<img/>', {
                'class': 'icon',
            }).appendTo(jQuery('<div/>', {
                'class': 'icon-input icon-primary',
            }).appendTo(group));
            this.but_secondary = jQuery('<img/>', {
                'class': 'icon',
            }).appendTo(jQuery('<div/>', {
                'class': 'icon-input icon-secondary',
            }).appendTo(group));
            this.but_primary.click('primary', this.edit.bind(this));
            this.but_secondary.click('secondary', this.edit.bind(this));

            // Use keydown to not receive focus-in TAB
            this.entry.on('keydown', this.key_press.bind(this));

            if (!attributes.completion || attributes.completion == "1") {
                Sao.common.get_completion(group,
                    this._update_completion.bind(this),
                    this._completion_match_selected.bind(this),
                    this._completion_action_activated.bind(this));
                this.wid_completion = true;
            }
            this.el.change(this.focus_out.bind(this));
            this._readonly = false;
        },
        get_screen: function() {
            var domain = this.field.get_domain(this.record);
            var context = this.field.get_context(this.record);
            var view_ids = (this.attributes.view_ids || '').split(',');
            if (!jQuery.isEmptyObject(view_ids)) {
                // Remove the first tree view as mode is form only
                view_ids.shift();
            }
            return new Sao.Screen(this.get_model(), {
                'context': context,
                'domain': domain,
                'mode': ['form'],
                'view_ids': view_ids,
                'views_preload': this.attributes.views,
                'readonly': this._readonly
            });
        },
        set_text: function(value) {
            if (jQuery.isEmptyObject(value)) {
                value = '';
            }
            this.entry.val(value);
        },
        get_text: function() {
            var record = this.record;
            if (record) {
                return record.field_get_client(this.field_name);
            }
            return '';
        },
        focus_out: function() {
            if (!this.attributes.completion ||
                    this.attributes.completion == "1") {
                if (this.el.find('.dropdown').hasClass('open')) {
                    return;
                }
            }
            Sao.View.Form.Many2One._super.focus_out.call(this);
        },
        set_value: function() {
            var record = this.record;
            var field = this.field;
            if (field.get_client(record) != this.entry.val()) {
                field.set_client(record, this.value_from_id(null, ''));
                this.entry.val('');
            }
        },
        display: function() {
            var record = this.record;
            var field = this.field;
            var text_value, value;
            Sao.View.Form.Many2One._super.display.call(this);

            this._set_button_sensitive();
            this._set_completion();

            if (!record) {
                this.entry.val('');
                return;
            }
            this.set_text(field.get_client(record));
            var primary, tooltip1, secondary, tooltip2;
            value = field.get(record);
            if (this.has_target(value)) {
                primary = 'tryton-open';
                tooltip1 = Sao.i18n.gettext("Open the record");
                secondary = 'tryton-clear';
                tooltip2 = Sao.i18n.gettext("Clear the field");
            } else {
                primary = null;
                tooltip1 = '';
                secondary = 'tryton-search';
                tooltip2 = Sao.i18n.gettext("Search a record");
            }
            if (this.entry.prop('readonly')) {
                secondary = null;
            }
            [
                [primary, tooltip1, this.but_primary, 'primary'],
                [secondary, tooltip2, this.but_secondary, 'secondary']
            ].forEach(function(items) {
                var icon_name = items[0];
                var tooltip = items[1];
                var button = items[2];
                var icon_input = button.parent();
                var type = 'input-icon-' + items[3];
                // don't use .hide/.show because the display value is not
                // correctly restored on modal.
                if (!icon_name) {
                    icon_input.hide();
                    icon_input.parent().removeClass(type);
                } else {
                    icon_input.show();
                    icon_input.parent().addClass(type);
                    Sao.common.ICONFACTORY.get_icon_url(icon_name).then(function(url) {
                        button.attr('src', url);
                    });
                }
                button.attr('aria-label', tooltip);
                button.attr('title', tooltip);
            });
        },
        focus: function() {
            this.entry.focus();
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this._set_button_sensitive();
        },
        _set_button_sensitive: function() {
            this.entry.prop('readonly', this._readonly);
            this.but_primary.prop('disabled', !this.read_access);
            this.but_secondary.prop('disabled', this._readonly);
        },
        get_access: function(type) {
            var model = this.get_model();
            if (model) {
                return Sao.common.MODELACCESS.get(model)[type];
            }
            return true;
        },
        get read_access() {
            return this.get_access('read');
        },
        get create_access() {
            return this.attributes.create && this.get_access('create');
        },
        id_from_value: function(value) {
            return value;
        },
        value_from_id: function(id, str) {
            if (str === undefined) {
                str = '';
            }
            return [id, str];
        },
        get_model: function() {
            return this.attributes.relation;
        },
        has_target: function(value) {
            return value !== undefined && value !== null;
        },
        edit: function(evt) {
            var model = this.get_model();
            if (!model || !Sao.common.MODELACCESS.get(model).read) {
                return;
            }
            var win, callback;
            var record = this.record;
            var value = record.field_get(this.field_name);

            if ((evt && evt.data == 'secondary') &&
                    !this._readonly &&
                    this.has_target(value)) {
                this.record.field_set_client(this.field_name,
                        this.value_from_id(null, ''));
                this.entry.val('');
                return;
            }
            if (this.has_target(value)) {
                var m2o_id =
                    this.id_from_value(record.field_get(this.field_name));
                if (evt && evt.ctrlKey) {
                    var params = {};
                    params.model = this.get_model();
                    params.res_id = m2o_id;
                    params.mode = ['form'];
                    params.name = this.attributes.string;
                    Sao.Tab.create(params);
                    return;
                }
                var screen = this.get_screen();
                callback = function(result) {
                    if (result) {
                        var rec_name_prm = screen.current_record.rec_name();
                        rec_name_prm.done(function(name) {
                            var value = this.value_from_id(
                                screen.current_record.id, name);
                            this.record.field_set_client(this.field_name,
                                value, true);
                        }.bind(this));
                    }
                };
                screen.switch_view().done(function() {
                    screen.load([m2o_id]);
                    win = new Sao.Window.Form(screen, callback.bind(this), {
                        save_current: true,
                        title: this.attributes.string
                    });
                }.bind(this));
                return;
            }
            if (model) {
                var dom;
                var domain = this.field.get_domain(record);
                var context = this.field.get_search_context(record);
                var order = this.field.get_search_order(record);
                var text = this.entry.val();
                callback = function(result) {
                    if (!jQuery.isEmptyObject(result)) {
                        var value = this.value_from_id(result[0][0],
                                result[0][1]);
                        this.record.field_set_client(this.field_name,
                                value, true);
                    }
                };
                var parser = new Sao.common.DomainParser();
                win = new Sao.Window.Search(model,
                        callback.bind(this), {
                            sel_multi: false,
                            context: context,
                            domain: domain,
                            order: order,
                            view_ids: (this.attributes.view_ids ||
                                '').split(','),
                            views_preload: (this.attributes.views || {}),
                            new_: this.create_access,
                            search_filter: parser.quote(text),
                            title: this.attributes.string
                        });
                return;
            }
        },
        new_: function(evt) {
            var model = this.get_model();
            if (!model || ! Sao.common.MODELACCESS.get(model).create) {
                return;
            }
            var screen = this.get_screen();
            var callback = function(result) {
                if (result) {
                    var rec_name_prm = screen.current_record.rec_name();
                    rec_name_prm.done(function(name) {
                        var value = this.value_from_id(
                            screen.current_record.id, name);
                        this.record.field_set_client(this.field_name, value);
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
        },
        key_press: function(event_) {
            var editable = !this.entry.prop('readonly');
            var activate_keys = [Sao.common.TAB_KEYCODE];
            var delete_keys = [Sao.common.BACKSPACE_KEYCODE,
                Sao.common.DELETE_KEYCODE];
            if (!this.wid_completion) {
                activate_keys.push(Sao.common.RETURN_KEYCODE);
            }

            if (event_.which == Sao.common.F3_KEYCODE &&
                    editable &&
                    this.create_access) {
                this.new_();
                event_.preventDefault();
            } else if (event_.which == Sao.common.F2_KEYCODE &&
                    this.read_access) {
                this.edit();
                event_.preventDefault();
            } else if (~activate_keys.indexOf(event_.which) && editable) {
                if (!this.attributes.completion ||
                        this.attributes.completion == "1") {
                    if (this.el.find('.dropdown').hasClass('open')) {
                        return;
                    }
                }
                this.activate();
            } else if (this.has_target(this.record.field_get(
                            this.field_name)) && editable) {
                var value = this.get_text();
                if ((value != this.entry.val()) ||
                        ~delete_keys.indexOf(event_.which)) {
                    this.entry.val('');
                    this.record.field_set_client(this.field_name,
                        this.value_from_id(null, ''));
                }
            }
        },
        activate: function() {
            var model = this.get_model();
            if (!model || !Sao.common.MODELACCESS.get(model).read) {
                return;
            }
            var record = this.record;
            var value = record.field_get(this.field_name);
            var sao_model = new Sao.Model(model);

            if (model && !this.has_target(value)) {
                var text = this.entry.val();
                if (!this._readonly && (text ||
                            this.field.get_state_attrs(this.record)
                            .required)) {
                    var dom;
                    var domain = this.field.get_domain(record);
                    var context = this.field.get_search_context(record);
                    var order = this.field.get_search_order(record);

                    var callback = function(result) {
                        if (!jQuery.isEmptyObject(result)) {
                            var value = this.value_from_id(result[0][0],
                                result[0][1]);
                            this.record.field_set_client(this.field_name,
                                value, true);
                        } else {
                            this.entry.val('');
                        }
                    };
                    var parser = new Sao.common.DomainParser();
                    var win = new Sao.Window.Search(model,
                            callback.bind(this), {
                                sel_multi: false,
                                context: context,
                                domain: domain,
                                order: order,
                                view_ids: (this.attributes.view_ids ||
                                    '').split(','),
                                views_preload: (this.attributes.views ||
                                    {}),
                                new_: this.create_access,
                                search_filter: parser.quote(text),
                                title: this.attributes.string
                            });
                }
            }
        },
        _set_completion: function() {
            var search = this.el.find('.action-search');
            if (this.read_access) {
                search.removeClass('disabled');
            } else {
                search.addClass('disabled');
            }
            var create = this.el.find('.action-create');
            if (this.create_access) {
                create.removeClass('disabled');
            } else {
                create.addClass('disabled');
            }
        },
        _update_completion: function(text) {
            var record = this.record;
            if (!record) {
                return;
            }
            var field = this.field;
            var value = field.get(record);
            if (this.has_target(value)) {
                var id = this.id_from_value(value);
                if ((id !== undefined) && (id >= 0)) {
                    return jQuery.when();
                }
            }
            var model = this.get_model();

            return Sao.common.update_completion(
                    this.entry, record, field, model);
        },
        _completion_match_selected: function(value) {
            this.record.field_set_client(this.field_name,
                    this.value_from_id(
                        value.id, value.rec_name), true);
        },
        _completion_action_activated: function(action) {
            if (action == 'search') {
                this.edit();
            } else if (action == 'create') {
                this.new_();
            }
        }
    });

    Sao.View.Form.One2One = Sao.class_(Sao.View.Form.Many2One, {
        class_: 'form-one2one'
    });

    Sao.View.Form.Reference = Sao.class_(Sao.View.Form.Many2One, {
        class_: 'form-reference',
        init: function(view, attributes) {
            Sao.View.Form.Reference._super.init.call(this, view, attributes);
            this.el.addClass('form-inline');
            this.select = jQuery('<select/>', {
                'class': 'form-control input-sm',
                'aria-label': attributes.string,
                'title': attributes.string,
            });
            this.el.prepend(this.select);
            this.select.change(this.select_changed.bind(this));
            Sao.common.selection_mixin.init.call(this);
            this.init_selection();
        },
        init_selection: function(key) {
            Sao.common.selection_mixin.init_selection.call(this, key,
                this.set_selection.bind(this));
        },
        update_selection: function(record, field, callback) {
            Sao.common.selection_mixin.update_selection.call(this, record,
                field, function(selection) {
                    this.set_selection(selection);
                    if (callback) {
                        callback();
                    }
                }.bind(this));
        },
        set_selection: function(selection) {
            var select = this.select;
            select.empty();
            selection.forEach(function(e) {
                select.append(jQuery('<option/>', {
                    'value': e[0],
                    'text': e[1]
                }));
            });
        },
        id_from_value: function(value) {
            return parseInt(value.split(',')[1], 10);
        },
        value_from_id: function(id, str) {
            if (!str) {
                str = '';
            }
            return [this.get_model(), [id, str]];
        },
        get_text: function() {
            var record = this.record;
            if (record) {
                return record.field_get_client(this.field_name)[1];
            }
            return '';
        },
        get_model: function() {
            return this.select.val();
        },
        has_target: function(value) {
            if (value === null) {
                return false;
            }
            var model = value.split(',')[0];
            value = value.split(',')[1];
            if (jQuery.isEmptyObject(value)) {
                value = null;
            } else {
                value = parseInt(value, 10);
                if (isNaN(value)) {
                    value = null;
                }
            }
            return (model == this.get_model()) && (value >= 0);
        },
        _set_button_sensitive: function() {
            Sao.View.Form.Reference._super._set_button_sensitive.call(this);
            this.select.prop('disabled', this.entry.prop('readonly'));
        },
        select_changed: function() {
            this.entry.val('');
            var model = this.get_model();
            var value;
            if (model) {
                value = [model, [-1, '']];
            } else {
                value = ['', ''];
            }
            this.record.field_set_client(this.field_name, value);
        },
        set_value: function() {
            var value;
            var record = this.record;
            var field = this.field;
            if (!this.get_model()) {
                value = this.entry.val();
                if (jQuery.isEmptyObject(value)) {
                    field.set_client(record, null);
                } else {
                    field.set_client(record, ['', value]);
                }
            } else {
                value = field.get_client(record, this.field_name);
                var model, name;
                if (value instanceof Array) {
                    model = value[0];
                    name = value[1];
                } else {
                    model = '';
                    name = '';
                }
                if ((model != this.get_model()) ||
                        (name != this.entry.val())) {
                    field.set_client(record, null);
                    this.entry.val('');
                }
            }
        },
        set_text: function(value) {
            var model;
            if (value) {
                model = value[0];
                value = value[1];
            } else {
                model = null;
                value = null;
            }
            Sao.View.Form.Reference._super.set_text.call(this, value);
            if (model) {
                this.select.val(model);
            } else {
                this.select.val('');
            }
        },
        display: function() {
            this.update_selection(this.record, this.field, function() {
                Sao.View.Form.Reference._super.display.call(this);
            }.bind(this));
        },
        set_readonly: function(readonly) {
            Sao.View.Form.Reference._super.set_readonly.call(this, readonly);
            this.select.prop('disabled', readonly);
        }
    });

    Sao.View.Form.One2Many = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-one2many',
        expand: true,
        init: function(view, attributes) {
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
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-switch')
            ).appendTo(buttons);
            this.but_switch.click(this.switch_.bind(this));

            this.but_previous = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("Previous"),
                'title': Sao.i18n.gettext("Previous"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-back')
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
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-forward')
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
                buttons =  jQuery('<div/>', {
                    'class': 'input-group-btn',
                }).appendTo(group);

                this.but_add = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'tabindex': -1,
                    'aria-label': Sao.i18n.gettext("Add"),
                    'title': Sao.i18n.gettext("Add"),
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add')
                ).appendTo(buttons);
                this.but_add.click(this.add.bind(this));

                this.but_remove = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'tabindex': -1,
                    'aria-label': Sao.i18n.gettext("Remove"),
                    'title': Sao.i18n.gettext("Remove"),
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove')
                ).appendTo(buttons);
                this.but_remove.click(this.remove.bind(this));
            }

            this.but_new = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("New"),
                'title': Sao.i18n.gettext("New"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-create')
            ).appendTo(buttons);
            this.but_new.click(this.new_.bind(this));

            this.but_open = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("Open"),
                'title': Sao.i18n.gettext("Open"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-open')
            ).appendTo(buttons);
            this.but_open.click(this.open.bind(this));

            this.but_del = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("Delete"),
                'title': Sao.i18n.gettext("Delete"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-delete')
            ).appendTo(buttons);
            this.but_del.click(this.delete_.bind(this));

            this.but_undel = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("Undelete"),
                'title': Sao.i18n.gettext("Undelete"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-undo')
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
                pre_validate: attributes.pre_validate
            });
            this.screen.pre_validate = attributes.pre_validate == 1;

            this.screen.message_callback = this.record_label.bind(this);
            this.prm = this.screen.switch_view(modes[0]).done(function() {
                this.content.append(this.screen.screen_container.el);
            }.bind(this));

            // TODO key_press

            this.but_switch.prop('disabled', this.screen.number_of_views <= 0);
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this._set_button_sensitive();
            this._set_label_state();
        },
        set_required: function(required) {
            this._required = required;
            this._set_label_state();
        },
        _set_label_state: function() {
            Sao.common.apply_label_attributes(this.title, this._readonly,
                    this._required);
        },
        _set_button_sensitive: function() {
            var access = Sao.common.MODELACCESS.get(this.screen.model_name);
            var size_limit, o2m_size;
            var record = this.record;
            var field = this.field;
            if (record && field) {
                var field_size = record.expr_eval(this.attributes.size);
                o2m_size = field.get_eval(record).length;
                size_limit = (((field_size !== undefined) &&
                            (field_size !== null)) &&
                        (o2m_size >= field_size) && (field_size >= 0));
            } else {
                o2m_size = null;
                size_limit = false;
            }
            var create = this.attributes.create;
            if (create === undefined) {
                create = true;
            }
            this.but_new.prop('disabled', this._readonly || !create ||
                    size_limit || !access.create);

            var delete_ = this.attributes['delete'];
            if (delete_ === undefined) {
                delete_ = true;
            }
            this.but_del.prop('disabled', this._readonly || !delete_ ||
                !access['delete'] || !this._position);
            this.but_undel.prop('disabled', this._readonly || size_limit ||
                 !this._position);
            this.but_open.prop('disabled', !access.read || !this._position);
            this.but_next.prop('disabled', (this.position > 0) && (
                this._position >= this._length));
            this.but_previous.prop('disabled', this._position <= 1);
            if (this.attributes.add_remove) {
                this.wid_text.prop('disabled', this._readonly);
                this.but_add.prop('disabled', this._readonly || size_limit ||
                        !access.write || !access.read);
                this.but_remove.prop('disabled', this._readonly ||
                        !this.position || !access.write || !access.read);
            }
        },
        display: function() {
            Sao.View.Form.One2Many._super.display.call(this);

            this._set_button_sensitive();

            this.prm.done(function() {
                var record = this.record;
                var field = this.field;

                if (!field) {
                    this.screen.new_group();
                    this.screen.current_record = null;
                    this.screen.group.parent = null;
                    this.screen.display();
                    return;
                }

                var new_group = record.field_get_client(this.field_name);
                if (new_group != this.screen.group) {
                    this.screen.set_group(new_group);
                    if ((this.screen.current_view.view_type == 'tree') &&
                            this.screen.current_view.editable) {
                        this.screen.current_record = null;
                    }
                }
                var domain = [];
                var size_limit = null;
                if (record) {
                    domain = field.get_domain(record);
                    size_limit = record.expr_eval(this.attributes.size);
                }
                if (this._readonly) {
                    if (size_limit === null) {
                        size_limit = this.screen.group.length;
                    } else {
                        size_limit = Math.min(
                                size_limit, this.screen.group.length);
                    }
                }
                if (!Sao.common.compare(this.screen.domain, domain)) {
                    this.screen.domain = domain;
                }
                this.screen.size_limit = size_limit;
                this.screen.display();
            }.bind(this));
        },
        focus: function() {
            if (this.attributes.add_remove) {
                this.wid_text.focus();
            }
        },
        activate: function(event_) {
            this.edit();
        },
        add: function(event_) {
            var access = Sao.common.MODELACCESS.get(this.screen.model_name);
            if (!access.write || !access.read) {
                return;
            }
            this.view.set_value();
            var domain = this.field.get_domain(this.record);
            var context = this.field.get_search_context(this.record);
            domain = [domain,
                this.record.expr_eval(this.attributes.add_remove)];
            var removed_ids = this.field.get_removed_ids(this.record);
            domain = ['OR', domain, ['id', 'in', removed_ids]];
            var text = this.wid_text.val();

            // TODO sequence

            var callback = function(result) {
                var prm = jQuery.when();
                if (!jQuery.isEmptyObject(result)) {
                    var ids = [];
                    var i, len;
                    for (i = 0, len = result.length; i < len; i++) {
                        ids.push(result[i][0]);
                    }
                    this.screen.group.load(ids, true);
                    prm = this.screen.display();
                }
                prm.done(function() {
                    this.screen.set_cursor();
                }.bind(this));
                this.wid_text.val('');
            }.bind(this);
            var parser = new Sao.common.DomainParser();
            var order = this.field.get_search_order(this.record);
            var win = new Sao.Window.Search(this.attributes.relation,
                    callback, {
                        sel_multi: true,
                        context: context,
                        domain: domain,
                        order: order,
                        view_ids: (this.attributes.view_ids ||
                                '').split(','),
                        views_preload: this.attributes.views || {},
                        new_: !this.but_new.prop('disabled'),
                        search_filter: parser.quote(text),
                        title: this.attributes.string
                    });
        },
        remove: function(event_) {
            var access = Sao.common.MODELACCESS.get(this.screen.model_name);
            if (!access.write || !access.read) {
                return;
            }
            this.screen.remove(false, true, false);
        },
        new_: function(event_) {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name).create) {
                return;
            }
            this.validate().done(function() {
                if (this.attributes.product) {
                    this.new_product();
                } else {
                    this.new_single();
                }
            }.bind(this));
        },
        new_single: function() {
            var context = jQuery.extend({},
                    this.field.get_context(this.record));
            // TODO sequence
            if (this.screen.current_view.type == 'form' ||
                    this.screen.current_view.editable) {
                this.screen.new_();
                this.screen.current_view.el.prop('disabled', false);
            } else {
                var record = this.record;
                var field_size = record.expr_eval(
                    this.attributes.size) || -1;
                field_size -= this.field.get_eval(record);
                var win = new Sao.Window.Form(this.screen, function() {}, {
                    new_: true,
                    many: field_size,
                    context: context,
                    title: this.attributes.string
                });
            }
        },
        new_product: function() {
            var fields = this.attributes.product.split(',');
            var product = {};
            var screen = this.screen;

            screen.new_(false).then(function(first) {
                first.default_get().then(function(default_) {
                    first.set_default(default_);

                    var search_set = function() {
                        if (jQuery.isEmptyObject(fields)) {
                            return make_product();
                        }
                        var field = screen.model.fields[fields.pop()];
                        var relation = field.description.relation;
                        if (!relation) {
                            search_set();
                        }

                        var domain = field.get_domain(first);
                        var context = field.get_search_context(first);
                        var order = field.get_search_order(first);

                        var callback = function(result) {
                            if (!jQuery.isEmptyObject(result)) {
                                product[field.name] = result;
                            }
                            search_set();
                        };
                        var win_search = new Sao.Window.Search(relation,
                                callback, {
                                    sel_multi: true,
                                    context: context,
                                    domain: domain,
                                    order: order,
                                    search_filter: '',
                                    title: this.attributes.string

                        });
                    }.bind(this);

                    var make_product = function() {
                        screen.group.remove(first, true);
                        if (jQuery.isEmptyObject(product)) {
                            return;
                        }

                        var fields = Object.keys(product);
                        var values = fields.map(function(field) {
                            return product[field];
                        });
                        Sao.common.product(values).forEach(function(values) {
                            screen.new_(false).then(function(record) {
                                var default_value = jQuery.extend({}, default_);
                                fields.forEach(function(field, i) {
                                    default_value[field] = values[i][0];
                                    default_value[field + '.rec_name'] = values[i][1];
                                });
                                record.set_default(default_value);
                            });
                        });
                    };

                    search_set();
                }.bind(this));
            }.bind(this));
        },
        open: function(event_) {
            this.edit();
        },
        delete_: function(event_) {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name)['delete']) {
                return;
            }
            this.screen.remove(false, false, false);
        },
        undelete: function(event_) {
            this.screen.unremove();
        },
        previous: function(event_) {
            this.validate().done(function() {
                this.screen.display_previous();
            }.bind(this));
        },
        next: function(event_) {
            this.validate().done(function() {
                this.screen.display_next();
            }.bind(this));
        },
        switch_: function(event_) {
            this.screen.switch_view();
        },
        edit: function() {
            if (!Sao.common.MODELACCESS.get(this.screen.model_name).read) {
                return;
            }
            this.validate().done(function() {
                var record = this.screen.current_record;
                if (record) {
                    var win = new Sao.Window.Form(this.screen, function() {},
                        {title: this.attributes.string});
                }
            }.bind(this));
        },
        record_label: function(data) {
            this._position = data[0];
            this._length = data[1];
            var message = data[0] + ' / ' + data[1];
            this.label.text(message).attr('title', message);
            this._set_button_sensitive();
        },
        validate: function() {
            var prm = jQuery.Deferred();
            this.view.set_value();
            var record = this.screen.current_record;
            if (record) {
                var fields = this.screen.current_view.get_fields();
                record.validate(fields).then(function(validate) {
                    if (!validate) {
                        this.screen.display(true);
                        prm.reject();
                        return;
                    }
                    if (this.screen.pre_validate) {
                        return record.pre_validate().then(function(validate) {
                            if (!validate) {
                                prm.reject();
                                return;
                            }
                            prm.resolve();
                        });
                    }
                    prm.resolve();
                }.bind(this));
            } else {
                prm.resolve();
            }
            return prm;
        },
        set_value: function() {
            this.screen.save_tree_state();
        }
    });

    Sao.View.Form.Many2Many = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-many2many',
        expand: true,
        init: function(view, attributes) {
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

            var buttons = jQuery('<div/>', {
                'class': 'input-group-btn'
            }).appendTo(group);
            this.but_add = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("Add"),
                'title': Sao.i18n.gettext("Add"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add')
            ).appendTo(buttons);
            this.but_add.click(this.add.bind(this));

            this.but_remove = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'tabindex': -1,
                'aria-label': Sao.i18n.gettext("Remove"),
                'title': Sao.i18n.gettext("Remove"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove')
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
                limit: null
            });
            this.screen.message_callback = this.record_label.bind(this);
            this.prm = this.screen.switch_view('tree').done(function() {
                this.content.append(this.screen.screen_container.el);
            }.bind(this));
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this._set_button_sensitive();
            this._set_label_state();
        },
        set_required: function(required) {
            this._required = required;
            this._set_label_state();
        },
        _set_label_state: function() {
            Sao.common.apply_label_attributes(this.title, this._readonly,
                    this._required);
        },
        _set_button_sensitive: function() {
            var size_limit = false,
                record = this.record,
                field = this.field;
            if (record && field) {
                var field_size = record.expr_eval(this.attributes.size);
                var m2m_size = field.get_eval(record).length;
                size_limit = (((field_size !== undefined) &&
                            (field_size !== null)) &&
                        (m2m_size >= field_size) && (field_size >= 0));
            }

            this.entry.prop('disabled', this._readonly);
            this.but_add.prop('disabled', this._readonly || size_limit);
            this.but_remove.prop('disabled', this._readonly ||
                this._position === 0);
        },
        record_label: function(data) {
            this._position = data[0];
            this._set_button_sensitive();
        },
        display: function() {
            Sao.View.Form.Many2Many._super.display.call(this);

            this.prm.done(function() {
                var record = this.record;
                var field = this.field;

                if (!field) {
                    this.screen.new_group();
                    this.screen.current_record = null;
                    this.screen.group.parent = null;
                    this.screen.display();
                    return;
                }
                var new_group = record.field_get_client(this.field_name);
                if (new_group != this.screen.group) {
                    this.screen.set_group(new_group);
                }
                this.screen.display();
            }.bind(this));
        },
        focus: function() {
            this.entry.focus();
        },
        activate: function() {
            this.edit();
        },
        add: function() {
            var dom;
            var domain = this.field.get_domain(this.record);
            var add_remove = this.record.expr_eval(
                this.attributes.add_remove);
            if (!jQuery.isEmptyObject(add_remove)) {
                domain = [domain, add_remove];
            }
            var context = this.field.get_search_context(this.record);
            var order = this.field.get_search_order(this.record);
            var value = this.entry.val();

            var callback = function(result) {
                if (!jQuery.isEmptyObject(result)) {
                    var ids = [];
                    var i, len;
                    for (i = 0, len = result.length; i < len; i++) {
                        ids.push(result[i][0]);
                    }
                    this.screen.group.load(ids, true);
                    this.screen.display();
                }
                this.entry.val('');
            }.bind(this);
            var parser = new Sao.common.DomainParser();
            var win = new Sao.Window.Search(this.attributes.relation,
                    callback, {
                        sel_multi: true,
                        context: context,
                        domain: domain,
                        order: order,
                        view_ids: (this.attributes.view_ids ||
                            '').split(','),
                        views_preload: this.attributes.views || {},
                        new_: this.attributes.create,
                        search_filter: parser.quote(value),
                        title: this.attributes.string
                    });
        },
        remove: function() {
            this.screen.remove(false, true, false);
        },
        key_press: function(event_) {
            var activate_keys = [Sao.common.TAB_KEYCODE];
            if (!this.wid_completion) {
                activate_keys.push(Sao.common.RETURN_KEYCODE);
            }

            if (event_.which == Sao.common.F3_KEYCODE) {
                this.new_();
                event_.preventDefault();
            } else if (event_.which == Sao.common.F2_KEYCODE) {
                this.add();
                event_.preventDefault();
            } else if (~activate_keys.indexOf(event_.which) && this.entry.val()) {
                this.add();
            }
        },
        _get_screen_form: function() {
            var domain = this.field.get_domain(this.record);
            var add_remove = this.record.expr_eval(
                    this.attributes.add_remove);
            if (!jQuery.isEmptyObject(add_remove)) {
                domain = [domain, add_remove];
            }
            var context = this.field.get_context(this.record);
            var view_ids = (this.attributes.view_ids || '').split(',');
            if (!jQuery.isEmptyObject(view_ids)) {
                // Remove the first tree view as mode is form only
                view_ids.shift();
            }
            return new Sao.Screen(this.attributes.relation, {
                'domain': domain,
                'view_ids': view_ids,
                'mode': ['form'],
                'views_preload': this.attributes.views,
                'context': context
            });
        },
        edit: function() {
            if (jQuery.isEmptyObject(this.screen.current_record)) {
                return;
            }
            // Create a new screen that is not linked to the parent otherwise
            // on the save of the record will trigger the save of the parent
            var screen = this._get_screen_form();
            var callback = function(result) {
                if (result) {
                    screen.current_record.save().done(function() {
                        // Force a reload on next display
                        this.screen.current_record.cancel();
                    }.bind(this));
                }
            }.bind(this);
            screen.switch_view().done(function() {
                screen.load([this.screen.current_record.id]);
                new Sao.Window.Form(screen, callback,
                    {title: this.attributes.string});
            }.bind(this));
        },
        new_: function() {
            var screen = this._get_screen_form();
            var callback = function(result) {
                if (result) {
                    var record = screen.current_record;
                    this.screen.group.load([record.id], true);
                }
                this.entry.val('');
            }.bind(this);
            screen.switch_view().done(function() {
                new Sao.Window.Form(screen, callback, {
                    'new_': true,
                    'save_current': true,
                    title: this.attributes.string,
                    rec_name: this.entry.val()
                });
            }.bind(this));
        }
    });

    Sao.View.Form.BinaryMixin = Sao.class_(Sao.View.Form.Widget, {
        init: function(view, attributes) {
            Sao.View.Form.BinaryMixin._super.init.call(
                this, view, attributes);
            this.filename = attributes.filename || null;
        },
        toolbar: function(class_) {
            var group = jQuery('<div/>', {
                'class': class_,
                'role': 'group'
            });

            this.but_save_as = jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button',
                'aria-label': Sao.i18n.gettext("Save As"),
                'title': Sao.i18n.gettext("Save As..."),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-save')
            ).appendTo(group);
            this.but_save_as.click(this.save_as.bind(this));

            this.input_select = jQuery('<input/>', {
                'type': 'file',
            }).change(this.select.bind(this));
            this.but_select = jQuery('<div/>', {
                'class': 'btn btn-default input-file',
                'type': 'button',
                'aria-label': Sao.i18n.gettext("Select"),
                'title': Sao.i18n.gettext("Select..."),
            }).append(this.input_select
            ).append(Sao.common.ICONFACTORY.get_icon_img('tryton-search')
            ).appendTo(group);

            this.but_clear = jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button',
                'aria-label': Sao.i18n.gettext("Clear"),
                'title': Sao.i18n.gettext("Clear"),
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-clear')
            ).appendTo(group);
            this.but_clear.click(this.clear.bind(this));

            return group;
        },
        get filename_field() {
            if (this.filename) {
                var record = this.record;
                if (record) {
                    return record.model.fields[this.filename];
                }
            }
        },
        update_buttons: function(value) {
            if (value) {
                this.but_save_as.show();
                this.but_select.hide();
                this.but_clear.show();
            } else {
                this.but_save_as.hide();
                this.but_select.show();
                this.but_clear.hide();
            }
        },
        select: function() {
            var record = this.record,
                field = this.field,
                filename_field = this.filename_field;

            Sao.common.get_input_data(this.input_select, function(data, filename) {
                field.set_client(record, data);
                if (filename_field) {
                    filename_field.set_client(record, filename);
                }
            }, !field.get_size);
        },
        open: function() {
            var params = {};
            var filename_field = this.filename_field;
            if (filename_field) {
                var filename = filename_field.get_client(this.record);
                // Valid mimetype will make the browser directly open the file
                params.mimetype = Sao.common.guess_mimetype(filename);
            }
            this.save_as(params);
        },
        save_as: function(params) {
            var mimetype = params.mimetype || 'application/octet-binary';
            var field = this.field;
            var record = this.record;
            var prm;
            if (field.get_data) {
                prm = field.get_data(record);
            } else {
                prm = jQuery.when(field.get(record));
            }
            prm.done(function(data) {
                var name;
                var field = this.filename_field;
                if (field) {
                    name = field.get(this.record);
                }
                Sao.common.download_file(data, name);
            }.bind(this));
        },
        clear: function() {
            this.input_select.val(null);
            var filename_field = this.filename_field;
            if (filename_field) {
                filename_field.set_client(this.record, null);
            }
            this.field.set_client(this.record, null);
        }
    });

    Sao.View.Form.Binary = Sao.class_(Sao.View.Form.BinaryMixin, {
        class_: 'form-binary',
        blob_url: '',
        init: function(view, attributes) {
            Sao.View.Form.Binary._super.init.call(this, view, attributes);

            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            var group = jQuery('<div/>', {
                'class': 'input-group input-group-sm'
            }).appendTo(this.el);

            this.size = jQuery('<input/>', {
                type: 'input',
                'class': 'form-control input-sm',
                'readonly': true
            }).appendTo(group);

            if (this.filename && attributes.filename_visible) {
                this.text = jQuery('<input/>', {
                    type: 'input',
                    'class': 'form-control input-sm'
                }).prependTo(group);
                this.text.change(this.focus_out.bind(this));
                // Use keydown to not receive focus-in TAB
                this.text.on('keydown', this.key_press.bind(this));
                this.text.css('width', '50%');
                this.size.css('width', '50%');

                this.but_open = jQuery('<button/>', {
                    'class': 'btn btn-default',
                    'type': 'button'
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-open')
                ).appendTo(jQuery('<span/>', {
                    'class': 'input-group-btn',
                }).prependTo(group));
                this.but_open.click(this.open.bind(this));
            }

            this.toolbar('input-group-btn').appendTo(group);
        },
        display: function() {
            Sao.View.Form.Binary._super.display.call(this);

            var record = this.record, field = this.field;
            if (!field) {
                if (this.text) {
                    this.text.val('');
                }
                this.size.val('');
                this.but_save_as.hide();
                return;
            }
            var size;
            if (field.get_size) {
                size = field.get_size(record);
            } else {
                size = field.get(record).length;
            }
            this.size.val(Sao.common.humanize(size));

            if (this.text) {
                this.text.val(this.filename_field.get(record) || '');
                if (size) {
                    this.but_open.parent().show();
                } else {
                    this.but_open.parent().hide();
                }
            }
            this.update_buttons(Boolean(size));
        },
        key_press: function(evt) {
            var editable = !this.wid_text.prop('readonly');
            if (evt.which == Sao.common.F3_KEYCODE && editable) {
                this.new_();
                evt.preventDefault();
            } else if (evt.which == Sao.common.F2_KEYCODE) {
                this.open();
                evt.preventDefault();
            }
        },
        set_value: function() {
            if (this.text) {
                this.filename_field.set_client(this.record,
                        this.text.val() || '');
            }
        },
        set_readonly: function(readonly) {
            this.but_select.prop('disabled', readonly);
            this.but_clear.prop('disabled', readonly);
            if (this.wid_text) {
                this.wid_text.prop('readonly', readonly);
            }
        }
    });

    Sao.View.Form.MultiSelection = Sao.class_(Sao.View.Form.Selection, {
        class_: 'form-multiselection',
        expand: true,
        init: function(view, attributes) {
            this.nullable_widget = false;
            Sao.View.Form.MultiSelection._super.init.call(
                this, view, attributes);
            this.select.prop('multiple', true);
        },
        display_update_selection: function() {
            var i, len, element;
            var record = this.record;
            var field = this.field;
            this.update_selection(record, field, function() {
                var yexpand = this.attributes.yexpand;
                if (yexpand === undefined) {
                    yexpand = this.expand;
                }
                if (!yexpand) {
                    this.select.prop('size', this.select.children().length);
                }
                if (!field) {
                    return;
                }
                var value = [];
                var group = record.field_get_client(this.field_name);
                for (i = 0, len = group.length; i < len; i++) {
                    element = group[i];
                    if (!~group.record_removed.indexOf(element) &&
                        !~group.record_deleted.indexOf(element)) {
                            value.push(element.id);
                    }
                }
                this.select.val(value);
            }.bind(this));
        },
        set_value: function() {
            var value = this.select.val();
            if (value) {
                value = value.map(function(e) { return parseInt(e, 10); });
            } else {
                value = [];
            }
            this.field.set_client(this.record, value);
        }
    });

    Sao.View.Form.Image = Sao.class_(Sao.View.Form.BinaryMixin, {
        class_: 'form-image',
        init: function(view, attributes) {
            Sao.View.Form.Image._super.init.call(this, view, attributes);
            this.height = parseInt(attributes.height || 100, 10);
            this.width = parseInt(attributes.width || 300, 10);

            this.el = jQuery('<div/>');
            this.image = jQuery('<img/>', {
                'class': 'center-block'
            }).appendTo(this.el);
            this.image.css('max-height', this.height);
            this.image.css('max-width', this.width);
            this.image.css('height', 'auto');
            this.image.css('width', 'auto');

            var group = this.toolbar('btn-group');
            if (!attributes.readonly) {
                jQuery('<div/>', {
                    'class': 'text-center'
                }).append(group).appendTo(this.el);
            }
        },
        set_readonly: function(readonly) {
            this.but_select.prop('disable', readonly);
            this.but_clear.prop('disable', readonly);
        },
        clear: function() {
            Sao.View.Form.Image._super.clear.call(this);
            this.update_img();
        },
        update_img: function() {
            var value;
            var record = this.record;
            if (record) {
                value = record.field_get_client(this.field_name);
            }
            if (value) {
                if (value > Sao.common.BIG_IMAGE_SIZE) {
                    value = jQuery.when(null);
                } else {
                    value = record.model.fields[this.field_name]
                        .get_data(record);
                }
            } else {
                value = jQuery.when(null);
            }
            value.done(function(data) {
                var url, blob;
                if (!data) {
                    url = null;
                } else {
                    blob = new Blob([data]);
                    url = window.URL.createObjectURL(blob);
                }
                this.image.attr('src', url);
                this.update_buttons(Boolean(data));
            }.bind(this));
        },
        display: function() {
            Sao.View.Form.Image._super.display.call(this);
            this.update_img();
        }
    });

    Sao.View.Form.URL = Sao.class_(Sao.View.Form.Char, {
        class_: 'form-url',
        init: function(view, attributes) {
            Sao.View.Form.URL._super.init.call(this, view, attributes);
            this.button = jQuery('<a/>', {
                'class': 'btn btn-default',
                'target': '_new'
            }).appendTo(jQuery('<span/>', {
                'class': 'input-group-btn'
            }).appendTo(this.group));
            this.icon = jQuery('<img/>').appendTo(this.button);
            this.set_icon();
        },
        display: function() {
            Sao.View.Form.URL._super.display.call(this);
            var url = '';
            var record = this.record;
            var field = this.field;
            if (record) {
                url = record.field_get_client(this.field_name);
            }
            this.set_url(url);
            if (record & this.attributes.icon) {
                var icon = this.attributes.icon;
                var value;
                if (icon in record.model.fields) {
                    value = record.field_get_client(icon);
                } else {
                    value = icon;
                }
                this.set_icon(value);
            }
        },
        set_icon: function(value) {
            value = value || 'tryton-public';
            Sao.common.ICONFACTORY.get_icon_url(value).done(function(url) {
                this.icon.attr('src', url);
            }.bind(this));
        },
        set_url: function(value) {
            this.button.attr('href', value);
        },
        set_readonly: function(readonly) {
            Sao.View.Form.URL._super.set_readonly.call(this, readonly);
            if (readonly) {
                this.input.hide();
                this.button.removeClass('btn-default');
                this.button.addClass('btn-link');
            } else {
                this.input.show();
                this.button.removeClass('btn-link');
                this.button.addClass('btn-default');
            }
        }
    });

    Sao.View.Form.Email = Sao.class_(Sao.View.Form.URL, {
        class_: 'form-email',
        set_url: function(value) {
            Sao.View.Form.Email._super.set_url.call(this, 'mailto:' + value);
        }
    });

    Sao.View.Form.CallTo = Sao.class_(Sao.View.Form.URL, {
        class_: 'form-callto',
        set_url: function(value) {
            Sao.View.Form.CallTo._super.set_url.call(this, 'callto:' + value);
        }
    });

    Sao.View.Form.SIP = Sao.class_(Sao.View.Form.URL, {
        class_: 'form-sip',
        set_url: function(value) {
            Sao.View.Form.SIP._super.set_url.call(this, 'sip:' + value);
        }
    });

    Sao.View.Form.HTML = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-html',
        init: function(view, attributes) {
            Sao.View.Form.HTML._super.init.call(this, view, attributes);
            Sao.View.Form.TranslateMixin.init.call(this);
            this.el = jQuery('<div/>', {
                'class': this.class_,
            });
            this.button = jQuery('<a/>', {
                'class': 'btn btn-lnk',
                'target': '_blank',
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
        },
        uri: function(language) {
            var record = this.record,
                uri;
            if (!record || (record.id < 0)) {
                uri = '';
            } else {
                uri = '/' + record.model.session.database +
                    '/ir/html/' + record.model.name + '/' + record.id + '/' +
                    this.field_name;
                uri += '?language=' + encodeURIComponent(
                    language || Sao.i18n.getlang());
                uri += '&title=' + encodeURIComponent(Sao.config.title);
            }
            return uri;
        },
        display: function() {
            Sao.View.Form.HTML._super.display.call(this);
            this.button.attr('href', this.uri());
        },
        translate_dialog: function(languages) {
            var options = {};
            languages.forEach(function(language) {
                options[language.name] = language.code;
            });
            Sao.common.selection(Sao.i18n.gettext("Choose a language"), options)
            .done(function(language) {
                window.open(this.uri(language), '_blank');
            }.bind(this));
        },
    });

    Sao.View.Form.ProgressBar = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-char',
        init: function(view, attributes) {
            Sao.View.Form.ProgressBar._super.init.call(
                this, view, attributes);
            this.el = jQuery('<div/>', {
                'class': this.class_ + ' progress'
            });
            this.progressbar = jQuery('<div/>', {
                'class': 'progress-bar',
                'role': 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': 100
            }).appendTo(this.el);
            this.progressbar.css('min-width: 2em');
        },
        display: function() {
            Sao.View.Form.ProgressBar._super.display.call(this);
            var value, text;
            var record = this.record;
            var field = this.field;
            if (!field) {
                value = 0;
                text = '';
            } else {
                value = field.get(record);
                text = field.get_client(record, 100);
                if (text) {
                    text = Sao.i18n.gettext('%1%', text);
                }
            }
            this.progressbar.attr('aria-valuenow', value * 100);
            this.progressbar.css('width', value * 100 + '%');
            this.progressbar.text(text);
        }
    });

    Sao.View.Form.Dict = Sao.class_(Sao.View.Form.Widget, {
        class_: 'form-dict',
        expand: true,
        init: function(view, attributes) {
            Sao.View.Form.Dict._super.init.call(this, view, attributes);

            this.schema_model = attributes.schema_model;
            this.fields = {};
            this.rows = {};

            this.el = jQuery('<div/>', {
                'class': this.class_ + ' panel panel-default'
            });
            var heading = jQuery('<div/>', {
                'class': this.class_ + '-heading panel-heading'
            }).appendTo(this.el);
            var label = jQuery('<label/>', {
                'class': this.class_ + '-string',
                'text': attributes.string
            }).appendTo(heading);

            label.uniqueId();
            this.el.uniqueId();
            this.el.attr('aria-labelledby', label.attr('id'));
            label.attr('for', this.el.attr('id'));

            var body = jQuery('<div/>', {
                'class': this.class_ + '-body panel-body form-horizontal'
            }).appendTo(this.el);
            this.container = jQuery('<div/>', {
                'class': this.class_ + '-container'
            }).appendTo(body);

            var group = jQuery('<div/>', {
                'class': 'input-group input-group-sm'
            }).appendTo(jQuery('<div>', {
                'class': 'col-sm-10 col-sm-offset-2'
            }).appendTo(jQuery('<div/>', {
                'class': 'form-group'
            }).appendTo(body)));
            this.wid_text = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control input-sm',
                'placeholder': Sao.i18n.gettext('Search'),
            }).appendTo(group);

            // TODO completion

            this.but_add = jQuery('<button/>', {
                'class': 'btn btn-default btn-sm',
                'type': 'button',
                'aria-label': Sao.i18n.gettext('Add')
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add')
            ).appendTo(jQuery('<div/>', {
                'class': 'input-group-btn'
            }).appendTo(group));
            this.but_add.click(this.add.bind(this));

            this._readonly = false;
            this._record_id = null;
        },
        _required_el: function() {
            return this.wid_text;
        },
        _invalid_el: function() {
            return this.wid_text;
        },
        add: function() {
            var context = this.field.get_context(this.record);
            var value = this.wid_text.val();
            var domain = this.field.get_domain(this.record);

            var callback = function(result) {
                if (!jQuery.isEmptyObject(result)) {
                    var ids = result.map(function(e) {
                        return e[0];
                    });
                    this.add_new_keys(ids);
                }
                this.wid_text.val('');
            }.bind(this);

            var parser = new Sao.common.DomainParser();
            var win = new Sao.Window.Search(this.schema_model,
                    callback, {
                        sel_multi: true,
                        context: context,
                        domain: domain,
                        new_: false,
                        search_filter: parser.quote(value),
                        title: this.attributes.string
                    });
        },
        add_new_keys: function(ids) {
            var field = this.field;
            field.add_new_keys(ids, this.record)
                .then(function(new_names) {
                    var focus = false;
                    new_names.forEach(function(name) {
                        if (!(name in this.fields)) {
                            this.add_line(name);
                            if (!focus) {
                                this.fields[name].input.focus();
                                focus = true;
                            }
                        }
                    }.bind(this));
                }.bind(this));
        },
        remove: function(key, modified) {
            if (modified === undefined) {
                modified = true;
            }
            delete this.fields[key];
            this.rows[key].remove();
            delete this.rows[key];
            if (modified) {
                this.set_value(this.record, this.field);
            }
        },
        set_value: function() {
            this.field.set_client(this.record, this.get_value());
        },
        get_value: function() {
            var value = {};
            for (var key in this.fields) {
                var widget = this.fields[key];
                value[key] = widget.get_value();
            }
            return value;
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this._set_button_sensitive();
            for (var key in this.fields) {
                var widget = this.fields[key];
                widget.set_readonly(readonly);
            }
            this.wid_text.prop('disabled', readonly);
        },
        _set_button_sensitive: function() {
            var create = this.attributes.create;
            if (create === undefined) {
                create = true;
            }
            var delete_ = this.attributes['delete'];
            if (delete_ === undefined) {
                delete_ = true;
            }
            this.but_add.prop('disabled', this._readonly || !create);
            for (var key in this.fields) {
                var button = this.fields[key].button;
                button.prop('disabled', this._readonly || !delete_);
            }
        },
        add_line: function(key) {
            var field, row;
            var key_schema = this.field.keys[key];
            this.fields[key] = field = new (
                this.get_entries(key_schema.type_))(key, this);
            this.rows[key] = row = jQuery('<div/>', {
                'class': 'form-group'
            });
            var text = key_schema.string + Sao.i18n.gettext(':');
            var label = jQuery('<label/>', {
                'text': text
            }).appendTo(jQuery('<div/>', {
                'class': 'dict-label col-sm-2 control-label'
            }).appendTo(row));

            field.el.addClass('col-sm-10').appendTo(row);

            label.uniqueId();
            field.labelled.uniqueId();
            field.labelled.attr('aria-labelledby', label.attr('id'));
            label.attr('for', field.labelled.attr('id'));

            field.button.click(function() {
                this.remove(key, true);
            }.bind(this));

            row.appendTo(this.container);
        },
        display: function() {
            Sao.View.Form.Dict._super.display.call(this);

            var record = this.record;
            var field = this.field;
            if (!field) {
                return;
            }

            var record_id = record ? record.id : null;
            var key;

            if (record_id != this._record_id) {
                for (key in this.fields) {
                    this.remove(key, false);
                }
                this._record_id = record_id;
            }

            var value = field.get_client(record);
            var new_key_names = Object.keys(value).filter(function(e) {
                return !this.fields[e];
            }.bind(this));

            var prm;
            if (!jQuery.isEmptyObject(new_key_names)) {
                prm = field.add_keys(new_key_names, record);
            } else {
                prm = jQuery.when();
            }
            prm.then(function() {
                var i, len, key;
                var keys = Object.keys(value).sort();
                var decoder = new Sao.PYSON.Decoder();
                var inversion = new Sao.common.DomainInversion();
                for (i = 0, len = keys.length; i < len; i++) {
                    key = keys[i];
                    var val = value[key];
                    if (!field.keys[key]) {
                        continue;
                    }
                    if (!this.fields[key]) {
                        this.add_line(key);
                    }
                    var widget = this.fields[key];
                    widget.set_value(val);
                    widget.set_readonly(this._readonly);
                    var key_domain = (decoder.decode(field.keys[key].domain ||
                        'null'));
                    if (key_domain !== null) {
                        if (!inversion.eval_domain(key_domain, value)) {
                            widget.el.addClass('has-error');
                        } else {
                            widget.el.removeClass('has-error');
                        }
                    }
                }
                var removed_key_names = Object.keys(this.fields).filter(
                        function(e) {
                            return !(e in value);
                        });
                for (i = 0, len = removed_key_names.length; i < len; i++) {
                    key = removed_key_names[i];
                    this.remove(key, false);
                }
            }.bind(this));
            this._set_button_sensitive();
        },
        get_entries: function(type) {
            switch (type) {
                case 'char':
                    return Sao.View.Form.Dict.Entry;
                case 'boolean':
                    return Sao.View.Form.Dict.Boolean;
                case 'selection':
                    return Sao.View.Form.Dict.Selection;
                case 'integer':
                    return Sao.View.Form.Dict.Integer;
                case 'float':
                    return Sao.View.Form.Dict.Float;
                case 'numeric':
                    return Sao.View.Form.Dict.Numeric;
                case 'date':
                    return Sao.View.Form.Dict.Date;
                case 'datetime':
                    return Sao.View.Form.Dict.DateTime;
            }
        }
    });

    Sao.View.Form.Dict.Entry = Sao.class_(Object, {
        class_: 'dict-char',
        init: function(name, parent_widget) {
            this.name = name;
            this.definition = parent_widget.field.keys[name];
            this.parent_widget = parent_widget;
            this.create_widget();
        },
        create_widget: function() {
            this.el = jQuery('<div/>', {
                'class': this.class_
            });
            var group = jQuery('<div/>', {
                'class': 'input-group input-group-sm'
            }).appendTo(this.el);
            this.input = this.labelled = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control input-sm mousetrap'
            }).appendTo(group);
            this.button = jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button',
                'arial-label': Sao.i18n.gettext('Remove')
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove')
            ).appendTo(jQuery('<div/>', {
                'class': 'input-group-btn'
            }).appendTo(group));

            this.el.change(
                    this.parent_widget.focus_out.bind(this.parent_widget));
        },
        get_value: function() {
            return this.input.val();
        },
        set_value: function(value) {
            this.input.val(value || '');
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this.input.prop('readonly', readonly);
        }
    });

    Sao.View.Form.Dict.Boolean = Sao.class_(Sao.View.Form.Dict.Entry, {
        class_: 'dict-boolean',
        create_widget: function() {
            Sao.View.Form.Dict.Boolean._super.create_widget.call(this);
            this.input.attr('type', 'checkbox');
            this.input.change(
                    this.parent_widget.focus_out.bind(this.parent_widget));
        },
        get_value: function() {
            return this.input.prop('checked');
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this.input.prop('disabled', readonly);
        },
        set_value: function(value) {
            this.input.prop('checked', value);
        }
    });

    Sao.View.Form.Dict.Selection = Sao.class_(Sao.View.Form.Dict.Entry, {
        class_: 'dict-selection',
        create_widget: function() {
            Sao.View.Form.Dict.Selection._super.create_widget.call(this);
            var select = jQuery('<select/>', {
                'class': 'form-control input-sm mousetrap'
            });
            select.change(
                    this.parent_widget.focus_out.bind(this.parent_widget));
            this.input.replaceWith(select);
            this.input = this.labelled = select;
            var selection = jQuery.extend([], this.definition.selection);
            selection.splice(0, 0, [null, '']);
            selection.forEach(function(e) {
                select.append(jQuery('<option/>', {
                    'value': JSON.stringify(e[0]),
                    'text': e[1],
                }));
            });
        },
        get_value: function() {
            return JSON.parse(this.input.val());
        },
        set_value: function(value) {
            this.input.val(JSON.stringify(value));
        },
        set_readonly: function(readonly) {
            this._readonly = readonly;
            this.input.prop('disabled', readonly);
        }
    });

    Sao.View.Form.Dict.Float = Sao.class_(Sao.View.Form.Dict.Entry, {
        class_: 'dict-float',
        create_widget: function() {
            Sao.View.Form.Dict.Float._super.create_widget.call(this);
            this.input_text = integer_input(this.input);
        },
        get digits() {
            var record = this.parent_widget.record;
            if (record) {
                var digits = record.expr_eval(this.definition.digits);
                if (!digits || !digits.every(function(e) {
                    return e !== null;
                })) {
                    return;
                }
                return digits;
            }
        },
        get_value: function() {
            var value = Number(this.input.val());
            if (isNaN(value)) {
                return null;
            }
            return value;
        },
        set_value: function(value) {
            var step = 'any',
                options = {};
            var digits = this.digits;
            if (digits) {
                step = Math.pow(10, -digits[1]).toFixed(digits[1]);
                options.minimumFractionDigits = digits[1];
                options.maximumFractionDigits = digits[1];
            }
            this.input.attr('step', step);
            Sao.View.Form.Dict.Float._super.set_value.call(this, value);
            if (value !== null) {
                this.input_text.val(value.toLocaleString(
                    Sao.i18n.BC47(Sao.i18n.getlang()), options));
            } else {
                this.input_text.val('');
            }
        },
    });

    Sao.View.Form.Dict.Numeric = Sao.class_(Sao.View.Form.Dict.Float, {
        class_: 'dict-numeric',
        get_value: function() {
            var value = new Sao.Decimal(this.input.val());
            if (isNaN(value.valueOf())) {
                return null;
            }
            return value;
        }
    });

    Sao.View.Form.Dict.Integer = Sao.class_(Sao.View.Form.Dict.Float, {
        class_: 'dict-integer',
        get_value: function() {
            var value = parseInt(this.input.val(), 10);
            if (isNaN(value)) {
                return null;
            }
            return value;
        },
    });


    Sao.View.Form.Dict.Date = Sao.class_(Sao.View.Form.Dict.Entry, {
        class_: 'dict-date',
        format: '%x',
        create_widget: function() {
            Sao.View.Form.Dict.Date._super.create_widget.call(this);
            this.date = this.input.parent();
            this.date.addClass('input-icon input-icon-primary');
            Sao.common.ICONFACTORY.get_icon_img('tryton-date')
                .appendTo(jQuery('<div/>', {
                    'class': 'datepickerbutton icon-input icon-primary',
                    'aria-label': Sao.i18n.gettext("Open the calendar"),
                    'title': Sao.i18n.gettext("Open the calendar"),
                }).prependTo(this.date));
            this.date.datetimepicker({
                'format': Sao.common.moment_format(this.format),
                'locale': moment.locale(),
                'keyBinds': null,
            });
            this.date.on('dp.change',
                    this.parent_widget.focus_out.bind(this.parent_widget));
            // We must set the overflow of the treeview and modal-body
            // containing the input to visible to prevent vertical scrollbar
            // inherited from the auto overflow-x
            // (see http://www.w3.org/TR/css-overflow-3/#overflow-properties)
            this.date.on('dp.hide', function() {
                this.date.closest('.treeview').css('overflow', '');
                this.date.closest('.modal-body').css('overflow', '');
            }.bind(this));
            this.date.on('dp.show', function() {
                this.date.closest('.treeview').css('overflow', 'visible');
                this.date.closest('.modal-body').css('overflow', 'visible');
            }.bind(this));
            var mousetrap = new Mousetrap(this.el[0]);

            mousetrap.bind(['enter', '='], function(e, combo) {
                if (e.which != Sao.common.RETURN_KEYCODE) {
                    e.preventDefault();
                }
                this.date.data('DateTimePicker').date(moment());
            }.bind(this));

            Sao.common.DATE_OPERATORS.forEach(function(operator) {
                mousetrap.bind(operator[0], function(e, combo) {
                    e.preventDefault();
                    var dp = this.date.data('DateTimePicker');
                    var date = dp.date();
                    date.add(operator[1]);
                    dp.date(date);
                }.bind(this));
            }.bind(this));
        },
        get_value: function() {
            var value = this.date.data('DateTimePicker').date();
            if (value) {
                value.isDate = true;
            }
            return value;
        },
        set_value: function(value) {
            this.date.off('dp.change');
            try {
                this.date.data('DateTimePicker').date(value);
            } finally {
                this.date.on('dp.change',
                    this.parent_widget.focus_out.bind(this.parent_widget));
            }
        }
    });

    Sao.View.Form.Dict.DateTime = Sao.class_(Sao.View.Form.Dict.Date, {
        class_: 'dict-datetime',
        format: '%x %X',
        get_value: function() {
            var value = this.date.data('DateTimePicker').date();
            if (value) {
                value.isDateTime = true;
            }
            return value;
        }
    });

    Sao.View.Form.PYSON = Sao.class_(Sao.View.Form.Char, {
        class_: 'form-pyson',
        init: function(view, attributes) {
            Sao.View.Form.PYSON._super.init.call(this, view, attributes);
            this.encoder = new Sao.PYSON.Encoder({});
            this.decoder = new Sao.PYSON.Decoder({}, true);
            this.el.keyup(this.validate_pyson.bind(this));
            this.icon = jQuery('<img/>', {
                'class': 'icon form-control-feedback',
            }).appendTo(this.group);
            this.group.addClass('has-feedback');
        },
        display: function() {
            Sao.View.Form.PYSON._super.display.call(this);
            this.validate_pyson();
        },
        get_encoded_value: function() {
            var value = this.input.val();
            if (!value) {
                return value;
            }
            try {
                return this.encoder.encode(eval_pyson(value));
            }
            catch (err) {
                return null;
            }
        },
        set_value: function() {
            // avoid modification because different encoding
            var value = this.get_encoded_value();
            var record = this.record;
            var field = this.field;
            var previous = field.get_client(record);
            if (previous && Sao.common.compare(
                value, this.encoder.encode(this.decoder.decode(previous)))) {
                value = previous;
            }
            field.set_client(record, value);
        },
        get_client_value: function() {
            var value = Sao.View.Form.PYSON._super.get_client_value.call(this);
            if (value) {
                value = Sao.PYSON.toString(this.decoder.decode(value));
            }
            return value;
        },
        validate_pyson: function() {
            var icon = 'ok';
            if (this.get_encoded_value() === null) {
                icon = 'error';
            }
            Sao.common.ICONFACTORY.get_icon_url('tryton-' + icon)
                .then(function(url) {
                    this.icon.attr('src', url);
                }.bind(this));
        },
        focus_out: function() {
            this.validate_pyson();
            Sao.View.Form.PYSON._super.focus_out.call(this);
        }
    });

    Sao.View.FormXMLViewParser.WIDGETS = {
        'biginteger': Sao.View.Form.Integer,
        'binary': Sao.View.Form.Binary,
        'boolean': Sao.View.Form.Boolean,
        'callto': Sao.View.Form.CallTo,
        'char': Sao.View.Form.Char,
        'date': Sao.View.Form.Date,
        'datetime': Sao.View.Form.DateTime,
        'dict': Sao.View.Form.Dict,
        'email': Sao.View.Form.Email,
        'float': Sao.View.Form.Float,
        'html': Sao.View.Form.HTML,
        'image': Sao.View.Form.Image,
        'integer': Sao.View.Form.Integer,
        'many2many': Sao.View.Form.Many2Many,
        'many2one': Sao.View.Form.Many2One,
        'multiselection': Sao.View.Form.MultiSelection,
        'numeric': Sao.View.Form.Float,
        'one2many': Sao.View.Form.One2Many,
        'one2one': Sao.View.Form.One2One,
        'password': Sao.View.Form.Password,
        'progressbar': Sao.View.Form.ProgressBar,
        'pyson': Sao.View.Form.PYSON,
        'reference': Sao.View.Form.Reference,
        'richtext': Sao.View.Form.RichText,
        'selection': Sao.View.Form.Selection,
        'sip': Sao.View.Form.SIP,
        'text': Sao.View.Form.Text,
        'time': Sao.View.Form.Time,
        'timedelta': Sao.View.Form.TimeDelta,
        'timestamp': Sao.View.Form.DateTime,
        'url': Sao.View.Form.URL,
    };
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.View.TreeXMLViewParser = Sao.class_(Sao.View.XMLViewParser, {
        _parse_tree: function(node, attributes) {
            [].forEach.call(node.childNodes, function(child) {
                this.parse(child);
            }.bind(this));
        },
        _parse_field: function(node, attributes) {
            var name = attributes.name;
            var ColumnFactory = Sao.View.TreeXMLViewParser.WIDGETS[
                attributes.widget];
            var column = new ColumnFactory(this.view.screen.model, attributes);
            if (!this.view.widgets[name]) {
                this.view.widgets[name] = [];
            }
            this.view.widgets[name].push(column);

            var prefixes = [], suffixes = [];
            if (~['url', 'email', 'callto', 'sip'
                    ].indexOf(attributes.widget)) {
                column.prefixes.push(
                    new Sao.View.Tree.Affix(attributes, attributes.widget));
            }
            if ('icon' in attributes) {
                column.prefixes.push(new Sao.View.Tree.Affix(attributes));
            }
            var affix, affix_attributes;
            var affixes = node.childNodes;
            for (var i = 0; i < affixes.length; i++) {
                affix = affixes[i];
                affix_attributes = {};
                for (var j = 0, len = affix.attributes.length; j < len; j++) {
                    var attribute = affix.attributes[j];
                    affix_attributes[attribute.name] = attribute.value;
                }
                if (!affix_attributes.name) {
                    affix_attributes.name = name;
                }
                var list;
                if (affix.tagName == 'prefix') {
                    list = column.prefixes;
                } else {
                    list = column.suffixes;
                }
                list.push(new Sao.View.Tree.Affix(affix_attributes));
            }
            if (!this.view.attributes.sequence &&
                    !this.view.children_field &&
                    this.field_attrs[name].sortable !== false){
                column.sortable = true;
            }
            this.view.columns.push(column);

            if (attributes.sum) {
                var label = attributes.sum + Sao.i18n.gettext(': ');
                var sum = jQuery('<label/>', {
                    'text': label,
                });
                var aggregate = jQuery('<span/>', {
                    'class': 'value',
                });
                this.view.sum_widgets[name] = [sum, aggregate];
            }
        },
        _parse_button: function(node, attributes) {
            var column = new Sao.View.Tree.ButtonColumn(
                this.view, attributes);
            this.view.columns.push(column);
        }
    });

    Sao.View.Tree = Sao.class_(Sao.View, {
        view_type: 'tree',
        xml_parser: Sao.View.TreeXMLViewParser,
        init: function(view_id, screen, xml, children_field) {
            this.children_field = children_field;
            this.sum_widgets = {};
            this.columns = [];
            this.selection_mode = (screen.attributes.selection_mode ||
                Sao.common.SELECTION_MULTIPLE);
            this.el = jQuery('<div/>', {
                'class': 'treeview responsive'
            });
            this.expanded = {};

            Sao.View.Tree._super.init.call(this, view_id, screen, xml);

            // Table of records
            this.rows = [];
            this.edited_row = null;
            this.table = jQuery('<table/>', {
                'class': 'tree table table-hover table-striped table-condensed'
            });
            if (this.editable) {
                this.table.addClass('table-bordered');
            }
            this.el.append(this.table);
            var colgroup = jQuery('<colgroup/>').appendTo(this.table);
            var col = jQuery('<col/>', {
                'class': 'selection-state',
            }).appendTo(colgroup);
            if (this.selection_mode == Sao.common.SELECTION_NONE) {
                col.css('width', 0);
            }
            this.thead = jQuery('<thead/>').appendTo(this.table);
            var tr = jQuery('<tr/>');
            var th = jQuery('<th/>', {
                'class': 'selection-state'
            });
            this.selection = jQuery('<input/>', {
                'type': 'checkbox',
            });
            this.selection.change(this.selection_changed.bind(this));
            th.append(this.selection);
            tr.append(th);
            this.thead.append(tr);

            this.tfoot = null;
            var sum_row;
            if (!jQuery.isEmptyObject(this.sum_widgets)) {
                sum_row = jQuery('<tr/>');
                sum_row.append(jQuery('<td/>'));
                this.tfoot = jQuery('<tfoot/>');
                this.tfoot.append(sum_row);
                this.table.append(this.tfoot);
            }

            this.columns.forEach(function(column) {
                col = jQuery('<col/>', {
                    'class': column.attributes.widget,
                }).appendTo(colgroup);
                th = jQuery('<th/>', {
                    'class': column.attributes.widget,
                });
                var label = jQuery('<label/>')
                    .text(column.attributes.string)
                    .attr('title', column.attributes.string);
                if (this.editable) {
                    if (column.attributes.required) {
                        label.addClass('required');
                    }
                    if (!column.attributes.readonly) {
                        label.addClass('editable');
                    }
                }
                if (column.attributes.help) {
                    label.attr('title', column.attributes.help);
                }
                if (column.sortable) {
                    var arrow = jQuery('<img/>', {
                        'class': 'icon',
                    });
                    label.append(arrow);
                    column.arrow = arrow;
                    th.click(column, this.sort_model.bind(this));
                    label.addClass('sortable');
                }
                tr.append(th.append(label));
                column.header = th;
                column.col = col;

                column.footers = [];
                if (!jQuery.isEmptyObject(this.sum_widgets)) {
                    var field_name = column.attributes.name;
                    var total_cell = jQuery('<td/>', {
                        'class': column.class_,
                    });
                    if (field_name in this.sum_widgets) {
                        var sum_label = this.sum_widgets[field_name][0];
                        var sum_value = this.sum_widgets[field_name][1];
                        total_cell.append(sum_label);
                        total_cell.append(sum_value);
                        total_cell.attr('data-title', sum_label.text());
                    }
                    sum_row.append(total_cell);
                    column.footers.push(total_cell);
                }
            }, this);
            this.tbody = jQuery('<tbody/>');
            this.table.append(this.tbody);

            this.display_size = Sao.config.display_size;
        },
        get editable() {
            return (Boolean(this.attributes.editable) &&
                !this.screen.attributes.readonly);
        },
        sort_model: function(e){
            var column = e.data;
            var arrow = column.arrow;
            this.columns.forEach(function(col) {
                if (col.arrow){
                    if (col != column && col.arrow.attr('src')) {
                        col.arrow.attr('src', '');
                    }
                }
            });
            this.screen.order = this.screen.default_order;
            if (arrow.data('order') == 'ASC') {
                arrow.data('order', 'DESC');
                Sao.common.ICONFACTORY.get_icon_url('tryton-arrow-up')
                    .then(function(url) {
                        arrow.attr('src', url);
                    });
                this.screen.order = [[column.attributes.name, 'DESC']];
            } else if (arrow.data('order') == 'DESC') {
                arrow.data('order', '');
                arrow.attr('src', '');
            } else {
                arrow.data('order', 'ASC');
                Sao.common.ICONFACTORY.get_icon_url('tryton-arrow-down')
                    .then(function(url) {
                        arrow.attr('src', url);
                    });
                this.screen.order = [[column.attributes.name, 'ASC']];
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
        update_arrow: function() {
            var order = this.screen.order,
                name = null,
                direction = null,
                icon = '';
            if (order && (order.length == 1)) {
                name = order[0][0];
                direction = order[0][1];
                icon = {
                    'ASC': 'tryton-arrow-down',
                    'DESC': 'tryton-arrow-up',
                }[direction];
            }
            this.columns.forEach(function(col) {
                var arrow = col.arrow;
                if (arrow) {
                    if (col.attributes.name != name) {
                        arrow.data('order', '');
                        arrow.attr('src', '');
                    } else {
                        arrow.data('order', direction);
                        Sao.common.ICONFACTORY.get_icon_url(icon)
                            .then(function(url) {
                                arrow.attr('src', url);
                            });
                    }
                }
            });
        },
        get_fields: function() {
            return Object.keys(this.widgets);
        },
        get_buttons: function() {
            var buttons = [];
            this.columns.forEach(function(column) {
                if (column instanceof Sao.View.Tree.ButtonColumn) {
                    buttons.push(column);
                }
            });
            return buttons;
        },
        display: function(selected, expanded) {
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
            // XXX find better check to keep focus
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
                } else if (!column.col.hasClass('selection-state') &&
                    !column.col.hasClass('favorite')) {
                    var width = {
                        'integer': 6,
                        'biginteger': 6,
                        'float': 8,
                        'numeric': 8,
                        'timedelta': 10,
                        'date': 10,
                        'datetime': 10,
                        'time': 10,
                        'selection': 9,
                        'char': 10,
                        'one2many': 5,
                        'many2many': 5,
                        'boolean': 2,
                        'binary': 20,
                    }[column.attributes.widget] || 10;
                    width = width * 100 + '%';
                    column.col.css('width', width);
                    column.col.show();
                }
            }.bind(this));
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
            return this.redraw(selected, expanded).done(
                Sao.common.debounce(this.update_sum.bind(this), 250));
        },
        construct: function(extend) {
            var tbody = this.tbody;
            if (!extend) {
                this.rows = [];
                this.tbody = jQuery('<tbody/>');
                this.edited_row = null;
            } else {
                this.tbody.find('tr.more-row').remove();
            }
            var start = this.rows.length;
            var add_row = function(record, pos, group) {
                var RowBuilder;
                if (this.editable) {
                    RowBuilder = Sao.View.Tree.RowEditable;
                } else {
                    RowBuilder = Sao.View.Tree.Row;
                }
                var tree_row = new RowBuilder(this, record, this.rows.length);
                this.rows.push(tree_row);
                tree_row.construct();
            };
            this.group.slice(start, this.display_size).forEach(
                    add_row.bind(this));
            if (!extend) {
                tbody.replaceWith(this.tbody);
            }

            if (this.display_size < this.group.length) {
                var more_row = jQuery('<tr/>', {
                    'class': 'more-row',
                });
                var more_cell = jQuery('<td/>');
                var more_button = jQuery('<button/>', {
                    'class': 'btn btn-default',
                    'type': 'button'
                }).append(Sao.i18n.gettext('More')
                    ).click(function() {
                    this.display_size += Sao.config.display_size;
                    this.display();
                }.bind(this));
                more_cell.append(more_button);
                more_row.append(more_cell);
                this.tbody.append(more_row);
            }
        },
        redraw: function(selected, expanded) {
            return redraw_async(this.rows, selected, expanded);
        },
        switch_: function(path) {
            this.screen.row_activate();
        },
        select_changed: function(record) {
            if (this.edited_row) {
                record = this.edited_row.record;
                this.edited_row.set_selection(true);
            }
            this.record = record;
            // TODO update_children
        },
        update_sum: function() {
            for (var name in this.sum_widgets) {
                if (!this.sum_widgets.hasOwnProperty(name)) {
                    continue;
                }

                var selected_records = this.selected_records;
                var aggregate = '-';
                var sum_label = this.sum_widgets[name][0];
                var sum_value = this.sum_widgets[name][1];
                var sum_ = null;
                var selected_sum = null;
                var loaded = true;
                var digit = 0;
                var field = this.screen.model.fields[name];
                var i, record;
                var records_ids = selected_records.map(function(record){
                    return record.id;
                });
                for (i=0; i < this.group.length; i++) {
                    record = this.group[i];
                    if (!record.get_loaded([name]) && record.id >=0){
                        loaded = false;
                        break;
                    }
                    var value = field.get(record);
                    if (value && value.isTimeDelta) {
                        value = value.asSeconds();
                    }
                    if (value !== null){
                        if (sum_ === null){
                            sum_ = value;
                        }else {
                            sum_ += value;
                        }
                        if (~records_ids.indexOf(record.id) ||
                            !selected_records){
                            if (selected_sum === null){
                                selected_sum = value;
                            }else {
                                selected_sum += value;
                            }
                        }
                        if (field.digits) {
                            var fdigits = field.digits(record);
                            if (fdigits && digit !== null){
                                digit = Math.max(fdigits[1], digit);
                            } else {
                                digit = null;
                            }
                        }
                    }
                }
                if (loaded) {
                    if (field.description.type == 'timedelta'){
                        var converter = field.converter(this.group);
                        selected_sum =  Sao.common.timedelta.format(
                            Sao.TimeDelta(null, selected_sum), converter);
                        sum_ = Sao.common.timedelta.format(
                            Sao.TimeDelta(null, sum_), converter);
                    } else if (digit !== null){
                        var options = {};
                        options.minimumFractionDigits = digit;
                        options.maximumFractionDigits = digit;
                        selected_sum = (selected_sum || 0).toLocaleString(
                            Sao.i18n.BC47(Sao.i18n.getlang()), options);
                        sum_ = (sum_ || 0).toLocaleString(
                            Sao.i18n.BC47(Sao.i18n.getlang()), options);
                    }
                    aggregate = selected_sum + ' / ' + sum_;
                }
                sum_value.text(aggregate);
                sum_value.parent().attr(
                    'title', sum_label.text() + ' ' + sum_value.text());
            }
        },
        get selected_records() {
            if (this.selection_mode == Sao.common.SELECTION_NONE) {
                return [];
            }
            var records = [];
            var add_record = function(row) {
                if (row.is_selected()) {
                    records.push(row.record);
                }
                row.rows.forEach(add_record);
            };
            this.rows.forEach(add_record);
            if (this.selection.prop('checked') &&
                    !this.selection.prop('indeterminate')) {
                this.group.slice(this.rows.length)
                    .forEach(function(record) {
                        records.push(record);
                    });
            }
            return records;
        },
        select_records: function(from, to) {
            if (!from && to) {
                from = this.rows[0].record;
            }
            if (from && to) {
                var from_idx = from.get_index_path(this.screen.group);
                var to_idx = to.get_index_path(this.screen.group);
                var max_len = Math.min(from_idx.length, to_idx.length);
                var tmp;
                for (var i=0; i < max_len; i++) {
                    if (from_idx[i] > to_idx[i]) {
                        tmp = from;
                        from = to;
                        to = tmp;
                        break;
                    }
                }
                if (!tmp && (from_idx.length > to_idx.length)) {
                    tmp = from;
                    from = to;
                    to = tmp;
                }
            }
            var value = this.rows[0].record === from;
            var select_record = function(row) {
                var record = row.record;
                if (record === from) {
                    value = true;
                }
                row.set_selection(value);
                if (record === to) {
                    value = false;
                }
                row.rows.forEach(select_record);
            };
            this.rows.forEach(select_record);
        },
        selection_changed: function() {
            var value = this.selection.prop('checked');
            var set_checked = function(row) {
                row.set_selection(value);
                row.rows.forEach(set_checked);
            };
            this.rows.forEach(set_checked);
            if (value && this.rows[0]) {
                this.select_changed(this.rows[0].record);
            } else {
                this.select_changed(null);
            }
            this.update_sum();
        },
        update_selection: function() {
            this.update_sum();
            var selected_records = this.selected_records;
            this.selection.prop('indeterminate', false);
            if (jQuery.isEmptyObject(selected_records)) {
                this.selection.prop('checked', false);
            } else if (selected_records.length ==
                    this.tbody.children().length &&
                    this.display_size >= this.group.length) {
                this.selection.prop('checked', true);
            } else {
                this.selection.prop('indeterminate', true);
                // Set checked to go first unchecked after first click
                this.selection.prop('checked', true);
            }
        },
        get_selected_paths: function() {
            var selected_paths = [];
            function get_selected(row, path) {
                var i, r, len, r_path;
                for (i = 0, len = row.rows.length; i < len; i++) {
                    r = row.rows[i];
                    r_path = path.concat([r.record.id]);
                    if (r.is_selected()) {
                        selected_paths.push(r_path);
                    }
                    get_selected(r, r_path);
                }
            }
            get_selected(this, []);
            return selected_paths;
        },
        get_expanded_paths: function(starting_path, starting_id_path) {
            var id_path, id_paths, row, children_rows, path;
            if (starting_path === undefined) {
                starting_path = [];
            }
            if (starting_id_path === undefined) {
                starting_id_path = [];
            }
            id_paths = [];
            row = this.find_row(starting_path);
            children_rows = row ? row.rows : this.rows;
            for (var path_idx = 0, len = this.n_children(row) ;
                    path_idx < len ; path_idx++) {
                path = starting_path.concat([path_idx]);
                row = children_rows[path_idx];
                if (row && row.is_expanded()) {
                    id_path = starting_id_path.concat(row.record.id);
                    id_paths.push(id_path);
                    id_paths = id_paths.concat(this.get_expanded_paths(path,
                                id_path));
                }
            }
            return id_paths;
        },
        find_row: function(path) {
            var index;
            var row = null;
            var group = this.rows;
            for (var i=0, len=path.length; i < len; i++) {
                index = path[i];
                if (!group || index >= group.length) {
                    return null;
                }
                row = group[index];
                group = row.rows;
                if (!this.children_field) {
                    break;
                }
            }
            return row;
        },
        n_children: function(row) {
            if (!row || !this.children_field) {
                return this.rows.length;
            }
            return row.record._values[this.children_field].length;
        },
        set_cursor: function(new_, reset_view) {
            var i, root_group, path, row_path, row, column;
            var row_idx, rest, td;

            if (!this.record) {
                return;
            }
            path = this.record.get_index_path(this.group);
            if (this.rows.length <= path[0]) {
                this.display_size = this.group.length;
                this.display();
            }
            row_idx = path[0];
            rest = path.slice(1);
            if (rest.length > 0) {
                this.rows[row_idx].expand_to_path(rest);
            }
            row = this.find_row(path);
            column = row.next_column(null, new_);
            if (column !== null) {
                td = row._get_column_td(column);
                if (this.editable && new_) {
                    td.trigger('click');
                }
                td.find(':input,[tabindex=0]').focus();
            }
        },
        save_row: function() {
            var i, prm, edited_row = this.edited_row;
            if (!this.editable || !this.edited_row) {
                return jQuery.when();
            }
            if (!this.edited_row.record.validate(
                    this.get_fields(), false, false, true)) {
                var focused = false;
                var invalid_fields = this.edited_row.record.invalid_fields();
                for (i = 0; i < this.columns.length; i++) {
                    var col = this.columns[i];
                    if (col.attributes.name in invalid_fields) {
                        var td = this.edited_row._get_column_td(i);
                        var editable_el = this.edited_row.get_editable_el(td);
                        var widget = editable_el.data('widget');
                        widget.display(this.edited_row.record, col.field);
                        if (!focused) {
                            widget.focus();
                            focused = true;
                        }
                    }
                }
                return;
            }
            if (!this.group.parent) {
                prm = this.edited_row.record.save();
            } else if (this.screen.attributes.pre_validate) {
                prm = this.record.pre_validate();
            } else {
                prm = jQuery.when();
            }
            prm.fail(function() {
                if (this.edited_row != edited_row) {
                    this.edit_row(null);
                    edited_row.set_selection(true);
                    edited_row.selection_changed();
                    this.edit_row(edited_row);
                }
            }.bind(this));
            return prm;
        },
        edit_row: function(row) {
            if (!this.editable || this.edited_row == row) {
                return;
            }
            if (this.edited_row) {
                this.edited_row.unset_editable();
            }
            if (row) {
                row.set_editable();
            }
            this.edited_row = row;
        }
    });

    function redraw_async(rows, selected, expanded) {
        var chunk = Sao.config.display_size;
        var dfd = jQuery.Deferred();
        var redraw_rows = function(i) {
            rows.slice(i, i + chunk).forEach(function(row) {
                row.redraw(selected, expanded);
            });
            i += chunk;
            if (i < rows.length) {
                setTimeout(redraw_rows, 0, i);
            } else {
                dfd.resolve();
            }
        };
        setTimeout(redraw_rows, 0, 0);
        return dfd;
    }

    Sao.View.Tree.Row = Sao.class_(Object, {
        init: function(tree, record, pos, parent) {
            this.tree = tree;
            this.current_column = null;
            this.rows = [];
            this.record = record;
            this.parent_ = parent;
            this.children_field = tree.children_field;
            this.expander = null;
            var path = [];
            if (parent) {
                path = jQuery.extend([], parent.path.split('.'));
            }
            path.push(pos);
            this.path = path.join('.');
            this.el = jQuery('<tr/>');
            this.el.on('click', this.select_row.bind(this));
        },
        is_expanded: function() {
            return (this.path in this.tree.expanded);
        },
        get_last_child: function() {
            if (!this.children_field || !this.is_expanded() ||
                    jQuery.isEmptyObject(this.rows)) {
                return this;
            }
            return this.rows[this.rows.length - 1].get_last_child();
        },
        get_id_path: function() {
            if (!this.parent_) {
                return [this.record.id];
            }
            return this.parent_.get_id_path().concat([this.record.id]);
        },
        build_widgets: function() {
            var table = jQuery('<table/>');
            table.css('width', '100%');
            var row = jQuery('<tr/>');
            table.append(row);
            return [table, row];
        },
        construct: function() {
            var el_node = this.el[0];
            while (el_node.firstChild) {
                el_node.removeChild(el_node.firstChild);
            }

            var td;
            this.tree.el.uniqueId();
            td = jQuery('<td/>', {
                'class': 'selection-state',
            }).click(function(event_) {
                event_.stopPropagation();
                this.selection.click();
            }.bind(this));
            this.el.append(td);
            this.selection = jQuery('<input/>', {
                'type': 'checkbox',
                'name': 'tree-selection-' + this.tree.el.attr('id'),
            });
            this.selection.click(function(event_) {
                event_.stopPropagation();
            });
            this.selection.change(this.selection_changed.bind(this));
            td.append(this.selection);

            var depth = this.path.split('.').length;
            var on_click = function(event_) {
                if (this.expander && !this.is_expanded() &&
                    (this.tree.n_children(this) <= Sao.config.limit)) {
                    this.toggle_row();
                }
                this.select_column(event_.data.index);
            }.bind(this);

            for (var i = 0; i < this.tree.columns.length; i++) {
                var column = this.tree.columns[i];
                td = jQuery('<td/>', {
                    'data-title': column.attributes.string + Sao.i18n.gettext(': ')
                }).append(jQuery('<span/>', { // For responsive min-height
                    'aria-hidden': true
                }));
                td.on('click keypress', {'index': i}, on_click);
                if (!this.tree.editable) {
                    td.dblclick(this.switch_row.bind(this));
                } else {
                    if (column.attributes.required) {
                        td.addClass('required');
                    }
                    if (!column.attributes.readonly) {
                        td.addClass('editable');
                    }
                }
                var widgets = this.build_widgets();
                var table = widgets[0];
                var row = widgets[1];
                td.append(table);
                if ((i === 0) && this.children_field) {
                    this.expander = jQuery('<img/>', {
                        'tabindex': 0,
                        'class': 'icon',
                    });
                    this.expander.html('&nbsp;');
                    var margin = 'margin-left';
                    if (Sao.i18n.rtl) {
                        margin = 'margin-right';
                    }
                    this.expander.css(margin, (depth - 1) + 'em');
                    this.expander.on('click keypress',
                            Sao.common.click_press(this.toggle_row.bind(this)));
                    row.append(jQuery('<td/>', {
                        'class': 'expander'
                    }).append(this.expander).css('width', 1));
                }
                var j;
                if (column.prefixes) {
                    for (j = 0; j < column.prefixes.length; j++) {
                        var prefix = column.prefixes[j];
                        row.append(jQuery('<td/>', {
                            'class': 'prefix'
                        }).css('width', 1));
                    }
                }
                row.append(jQuery('<td/>', {
                    'class': 'widget'
                }));
                if (column.suffixes) {
                    for (j = 0; j < column.suffixes.length; j++) {
                        var suffix = column.suffixes[j];
                        row.append(jQuery('<td/>', {
                            'class': 'suffix'
                        }).css('width', 1));
                    }
                }

                this.el.append(td);
            }
            if (this.parent_) {
                var last_child = this.parent_.get_last_child();
                last_child.el.after(this.el);
            } else {
                this.tree.tbody.append(this.el);
            }
        },
        _get_column_td: function(column_index, row) {
            row = row || this.el;
            return jQuery(row.children()[column_index + 1]);
        },
        redraw: function(selected, expanded) {
            selected = selected || [];
            expanded = expanded || [];
            var thead_visible = this.tree.thead.is(':visible');

            switch(this.tree.selection_mode) {
                case Sao.common.SELECTION_NONE:
                    this.selection.hide();
                    break;
                case Sao.common.SELECTION_SINGLE:
                    this.selection.attr('type', 'radio');
                    this.selection.show();
                    break;
                case Sao.common.SELECTION_MULTIPLE:
                    this.selection.attr('type', 'checkbox');
                    this.selection.show();
                    break;
            }


            for (var i = 0; i < this.tree.columns.length; i++) {
                var column = this.tree.columns[i];
                var td = this._get_column_td(i);
                var tr = td.find('tr');
                var cell;
                if (column.prefixes) {
                    for (var j = 0; j < column.prefixes.length; j++) {
                        var prefix = column.prefixes[j];
                        var prefix_el = jQuery(tr.children('.prefix')[j]);
                        cell = prefix_el.children();
                        if (cell.length) {
                            prefix.render(this.record, cell);
                        } else {
                            prefix_el.html(prefix.render(this.record));
                        }
                    }
                }
                var widget = tr.children('.widget');
                cell = widget.children();
                if (cell.length) {
                    column.render(this.record, cell);
                } else {
                    widget.html(column.render(this.record));
                }
                if (column.suffixes) {
                    for (var k = 0; k < column.suffixes.length; k++) {
                        var suffix = column.suffixes[k];
                        var suffix_el = jQuery(tr.children('.suffix')[k]);
                        cell = suffix_el.children();
                        if (cell.length) {
                            suffix.render(this.record, cell);
                        } else {
                            suffix_el.html(suffix.render(this.record));
                        }
                    }
                }
                if ((column.header.is(':hidden') && thead_visible) ||
                        column.header.css('display') == 'none') {
                    td.hide();
                    td.addClass('invisible');
                } else {
                    td.show();
                    td.removeClass('invisible');
                }
            }
            var row_id_path = this.get_id_path();
            this.set_selection(Sao.common.contains(selected, row_id_path));
            if (this.children_field) {
                this.record.load(this.children_field).done(function() {
                    var length = this.record.field_get_client(
                        this.children_field).length;
                    if (length && (
                        this.is_expanded() ||
                        Sao.common.contains(expanded, row_id_path))) {
                        this.expander.css('visibility', 'visible');
                        this.tree.expanded[this.path] = this;
                        this.expand_children(selected, expanded);
                        this.update_expander(true);
                    } else {
                        this.expander.css('visibility',
                            length ? 'visible' : 'hidden');
                        this.update_expander(false);
                    }
                }.bind(this));
            }
            if (this.record.deleted || this.record.removed) {
                this.el.css('text-decoration', 'line-through');
            } else {
                this.el.css('text-decoration', 'inherit');
            }
        },
        toggle_row: function() {
            if (this.is_expanded()) {
                this.update_expander(false);
                delete this.tree.expanded[this.path];
                this.collapse_children();
            } else {
                if (this.tree.n_children(this) > Sao.config.limit) {
                    this.tree.record = this.record;
                    this.tree.screen.switch_view('form');
                } else {
                    this.update_expander(true);
                    this.tree.expanded[this.path] = this;
                    this.expand_children();
                }
            }
            return false;
        },
        update_expander: function(expanded) {
            var icon;
            if (expanded) {
                icon = 'tryton-arrow-down';
            } else {
                icon = 'tryton-arrow-right';
            }
            Sao.common.ICONFACTORY.get_icon_url(icon)
                .then(function(url) {
                    this.expander.attr('src', url);
                }.bind(this));
        },
        collapse_children: function() {
            this.rows.forEach(function(row, pos, rows) {
                row.collapse_children();
                var node = row.el[0];
                node.parentNode.removeChild(node);
            });
            this.rows = [];
        },
        expand_children: function(selected, expanded) {
            return this.record.load(this.children_field).done(function() {
                if (this.rows.length === 0) {
                    var children = this.record.field_get_client(
                        this.children_field);
                    children.forEach(function(record, pos, group) {
                        var tree_row = new this.Class(
                            this.tree, record, pos, this);
                        tree_row.construct(selected, expanded);
                        this.rows.push(tree_row);
                    }.bind(this));
                }
                redraw_async(this.rows, selected, expanded);
            }.bind(this));
        },
        switch_row: function() {
            if (window.getSelection) {
                if (window.getSelection().empty) {  // Chrome
                    window.getSelection().empty();
                } else if (window.getSelection().removeAllRanges) {  // Firefox
                    window.getSelection().removeAllRanges();
                }
            } else if (document.selection) {  // IE?
                document.selection.empty();
            }
            if (this.tree.selection_mode != Sao.common.SELECTION_NONE) {
                this.set_selection(true);
                this.selection_changed();
                if (!this.is_selected()) {
                    return;
                }
            }
            this.tree.switch_(this.path);
        },
        select_column: function(index) {
        },
        select_row: function(event_) {
            if (this.tree.selection_mode == Sao.common.SELECTION_NONE) {
                this.tree.select_changed(this.record);
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
        },
        is_selected: function() {
            if (this.tree.selection_mode == Sao.common.SELECTION_NONE) {
                return false;
            }
            return this.selection.prop('checked');
        },
        set_selection: function(value) {
            if (this.tree.selection_mode == Sao.common.SELECTION_NONE) {
                return;
            }
            this.selection.prop('checked', value);
            if (value) {
                this.el.addClass('selected');
            } else {
                this.el.removeClass('selected');
            }
            if (!value) {
                this.tree.selection.prop('checked', false);
            }
        },
        selection_changed: function() {
            var is_selected = this.is_selected();
            this.set_selection(is_selected);
            if (is_selected) {
                this.tree.select_changed(this.record);
            } else {
                this.tree.select_changed(
                        this.tree.selected_records[0] || null);
            }
            this.tree.update_selection();
        },
        expand_to_path: function(path) {
            var row_idx, rest;
            row_idx = path[0];
            rest = path.slice(1);
            if (rest.length > 0) {
                this.rows[row_idx].expand_children().done(function() {
                    this.rows[row_idx].expand_to_path(rest);
                }.bind(this));
            }
        },
        next_column: function(path, editable, sign) {
            var i, readonly, invisible;
            var column, column_index, state_attrs;

            sign = sign || 1;
            if ((path === null) && (sign > 0)) {
                path = -1;
            } else if (path === null) {
                path = 0;
            }
            column_index = 0;
            for (i = 0; i < this.tree.columns.length; i++) {
                column_index = ((path + (sign * (i + 1))) %
                        this.tree.columns.length);
                // javascript modulo returns negative number for negative
                // numbers
                if (column_index < 0) {
                    column_index += this.tree.columns.length;
                }
                column = this.tree.columns[column_index];
                if (!column.field) {
                    continue;
                }
                state_attrs = column.field.get_state_attrs(this.record);
                invisible = state_attrs.invisible;
                if (column.header.is(':hidden')) {
                    invisible = true;
                }
                if (editable) {
                    readonly = (column.attributes.readonly ||
                            state_attrs.readonly);
                } else {
                    readonly = false;
                }
                if (!(invisible || readonly)) {
                    return column_index;
                }
            }
        }
    });

    Sao.View.Tree.RowEditable = Sao.class_(Sao.View.Tree.Row, {
        init: function(tree, record, pos, parent) {
            Sao.View.Tree.RowEditable._super.init.call(this, tree, record, pos,
                parent);
            this.edited_column = null;
            this.el.on('keypress', function(event_) {
                if ((event_.which == Sao.common.RETURN_KEYCODE) &&
                    (this.tree.edited_row != this)) {
                    this.tree.edit_row(this);
                    event_.preventDefault();
                }
            }.bind(this));
        },
        redraw: function(selected, expanded) {
            var i, tr, td, widget;
            var field;

            Sao.View.Tree.RowEditable._super.redraw.call(this, selected,
                    expanded);
            var display_callback = function(widget) {
                var record = this.record;
                return function() {
                    var field = record.model.fields[widget.field_name];
                    field.set_state(record);
                    widget.display(record, field);
                };
            }.bind(this);
            // The autocompletion widget do not call display thus we have to
            // call it when redrawing the row
            for (i = 0; i < this.tree.columns.length; i++) {
                var column = this.tree.columns[i];
                td = this._get_column_td(i);
                tr = td.find('tr');
                widget = jQuery(tr.children('.widget-editable')).data('widget');
                if (widget) {
                    this.record.load(column.attributes.name).done(
                        display_callback(widget));
                }
            }
        },
        select_column: function(index) {
            this.edited_column = index;
        },
        select_row: function(event_) {
            var body, listener;
            event_.stopPropagation();
            if (this.tree.edited_row &&
                    (event_.currentTarget == this.tree.edited_row.el[0])) {
                return;
            }

            body = listener = jQuery(document.body);
            if (body.hasClass('modal-open')) {
                listener = this.tree.el.parents('.modal').last();
            }
            var handler = function(event_) {
                if ((event_.currentTarget == body[0]) &&
                    body.hasClass('modal-open')) {
                    return;
                }

                if (!this.tree.save_row()) {
                    event_.preventDefault();
                    event_.stopPropagation();
                    return;
                }
                body.off('click.sao.editabletree');
                this.tree.edit_row(null);
                return true;
            }.bind(this);
            if (!handler(event_)) {
                return;
            }
            listener.on('click.sao.editabletree', handler);

            Sao.View.Tree.RowEditable._super.select_row.call(this, event_);

            if (!event_.shiftKey && !event_.ctrlKey) {
                this.tree.edit_row(this);
            }
        },
        unset_editable: function() {
            this.tree.columns.forEach(function(col, idx) {
                var td = this._get_column_td(idx);
                var static_el = this.get_static_el(td);
                static_el.html(col.render(this.record)).show();
                this.get_editable_el(td)
                    .empty()
                    .data('widget', null)
                    .parents('.treeview td').addBack().removeClass('edited');
            }.bind(this));
        },
        set_editable: function() {
            var focus_widget = null;
            for (var i = 0, len=this.tree.columns.length; i < len; i++) {
                var td = this._get_column_td(i);
                var col = this.tree.columns[i];
                if (!col.field) {
                    continue;
                }
                var EditableBuilder = Sao.View.EditableTree.WIDGETS[
                    col.attributes.widget];
                if (!col.attributes.readonly && EditableBuilder) {
                    var widget = new EditableBuilder(
                        this.tree, col.attributes);
                    widget.el.on('keydown', this.key_press.bind(this));

                    var editable_el = this.get_editable_el(td);
                    editable_el.append(widget.el);
                    editable_el.data('widget', widget);
                    widget.display(this.record, col.field);

                    var static_el = this.get_static_el(td);
                    static_el.hide();
                    editable_el.show();
                    editable_el.parents('.treeview td').addBack()
                        .addClass('edited');

                    if (this.edited_column == i) {
                        focus_widget = widget;
                    }
                }
            }
            if (focus_widget) {
                focus_widget.focus();
            }
        },
        get_static_el: function(td) {
            td = td || this.get_active_td();
            return td.find('.widget');
        },
        get_editable_el: function(td) {
            td = td || this.get_active_td();
            var editable = td.find('.widget-editable');
            if (!editable.length) {
                editable = jQuery('<td/>', {
                        'class': 'widget-editable'
                    }).insertAfter(td.find('.widget'));
            }
            return editable;
        },
        get_active_td: function() {
            return this._get_column_td(this.edited_column);
        },
        key_press: function(event_) {
            var current_td, selector, next_column, next_idx, i, next_row;
            var states;

            if (((event_.which != Sao.common.TAB_KEYCODE) &&
                    (event_.which != Sao.common.UP_KEYCODE) &&
                    (event_.which != Sao.common.DOWN_KEYCODE) &&
                    (event_.which != Sao.common.ESC_KEYCODE) &&
                    (event_.which != Sao.common.RETURN_KEYCODE)) ||
                jQuery(event_.currentTarget).find('.dropdown-menu').length) {
                return;
            }
            var td = this._get_column_td(this.edited_column);
            var editable_el = this.get_editable_el(td);
            var widget = editable_el.data('widget');
            widget.focus_out();
            var column = this.tree.columns[this.edited_column];
            if (column.field.validate(this.record)) {
                if (event_.which == Sao.common.TAB_KEYCODE) {
                    var sign = 1;
                    if (event_.shiftKey) {
                        sign = -1;
                    }
                    event_.preventDefault();
                    next_idx = this.next_column(this.edited_column, true, sign);
                    if (next_idx !== null) {
                        this.edited_column = next_idx;
                        td = this._get_column_td(next_idx);
                        editable_el = this.get_editable_el(td);
                        widget = editable_el.data('widget');
                        widget.focus();
                    }
                } else if (event_.which == Sao.common.UP_KEYCODE ||
                    event_.which == Sao.common.DOWN_KEYCODE) {
                    if (event_.which == Sao.common.UP_KEYCODE) {
                        next_row = this.el.prev('tr');
                    } else {
                        next_row = this.el.next('tr');
                    }
                    next_column = this.edited_column;
                    this.record.validate(this.tree.get_fields())
                        .then(function(validate) {
                            if (!validate) {
                                next_row = null;
                                var invalid_fields =
                                    this.record.invalid_fields();
                                for (i = 0; i < this.tree.columns.length; i++) {
                                    var col = this.tree.columns[i];
                                    if (col.attributes.name in invalid_fields) {
                                        next_column = i;
                                        break;
                                    }
                                }
                            } else {
                                var prm;
                                if (!this.tree.screen.group.parent) {
                                    prm = this.record.save();
                                } else if (this.tree.screen.attributes.pre_validate) {
                                    prm = this.record.pre_validate();
                                }
                                if (prm) {
                                    return prm.fail(function() {
                                        widget.focus();
                                    });
                                }
                            }
                        }.bind(this)).then(function() {
                            window.setTimeout(function() {
                                this._get_column_td(next_column, next_row)
                                    .trigger('click');
                            }.bind(this), 0);
                        }.bind(this));
                } else if (event_.which == Sao.common.ESC_KEYCODE) {
                    this.tree.edit_row(null);
                    this.get_static_el().show().find('[tabindex=0]').focus();
                } else if (event_.which == Sao.common.RETURN_KEYCODE) {
                    var focus_cell = function(row) {
                        this._get_column_td(this.edited_column, row)
                            .trigger('click');
                    }.bind(this);
                    if (this.tree.attributes.editable == 'bottom') {
                        next_row = this.el.next('tr');
                    } else {
                        next_row = this.el.prev('tr');
                    }
                    if (next_row.length) {
                        focus_cell(next_row);
                    } else {
                        var model = this.tree.screen.group;
                        var access = Sao.common.MODELACCESS.get(
                                this.tree.screen.model_name);
                        var limit = ((this.tree.screen.size_limit !== null) &&
                                (model.length >= this.tree.screen.size_limit));
                        var prm;
                        if (!access.create || limit) {
                            prm = jQuery.when();
                        } else {
                            prm = this.tree.screen.new_();
                        }
                        prm.done(function() {
                            var new_row;
                            var rows = this.tree.tbody.children('tr');
                            if (this.tree.attributes.editable == 'bottom') {
                                new_row = rows.last();
                            } else {
                                new_row = rows.first();
                            }
                            focus_cell(new_row);
                        }.bind(this));
                    }
                }
                event_.preventDefault();
            } else {
                widget.display(this.record, column.field);
            }
        }
    });

    Sao.View.Tree.Affix = Sao.class_(Object, {
        init: function(attributes, protocol) {
            this.attributes = attributes;
            this.protocol = protocol || null;
            this.icon = attributes.icon;
            if (this.protocol && !this.icon) {
                this.icon = 'tryton-public';
            }
        },
        get_cell: function() {
            var cell;
            if (this.protocol) {
                cell = jQuery('<a/>', {
                    'target': '_new'
                });
                cell.append(jQuery('<img/>'));
                cell.click({'cell': cell}, this.clicked.bind(this));
            } else if (this.icon) {
                cell = jQuery('<img/>');
            } else {
                cell = jQuery('<span/>');
                cell.attr('tabindex', 0);
            }
            cell.addClass('column-affix');
            return cell;
        },
        render: function(record, cell) {
            if (!cell) {
                cell = this.get_cell();
            }
            record.load(this.attributes.name).done(function() {
                var value;
                var field = record.model.fields[this.attributes.name];
                var invisible = field.get_state_attrs(record).invisible;
                if (invisible) {
                    cell.hide();
                } else {
                    cell.show();
                }
                if (this.protocol) {
                    value = field.get(record);
                    if (!jQuery.isEmptyObject(value)) {
                        switch (this.protocol) {
                            case 'email':
                                value = 'mailto:' + value;
                                break;
                            case 'callto':
                                value = 'callto:' + value;
                                break;
                            case 'sip':
                                value = 'sip:' + value;
                                break;
                        }
                    }
                    cell.attr('src', value);
                }
                if (this.icon) {
                    if (this.icon in record.model.fields) {
                        var icon_field = record.model.fields[this.icon];
                        value = icon_field.get_client(record);
                    }
                    else {
                        value = this.icon;
                    }
                    Sao.common.ICONFACTORY.get_icon_url(value)
                        .done(function(url) {
                            var img_tag;
                            if (cell.children('img').length) {
                                img_tag = cell.children('img');
                            } else {
                                img_tag = cell;
                            }
                            img_tag.attr('src', url || '');
                        }.bind(this));
                } else {
                    value = this.attributes.string || '';
                    if (!value) {
                        value = field.get_client(record) || '';
                    }
                    cell.text(value);
                }
            }.bind(this));
            return cell;
        },
        clicked: function(event) {
            event.preventDefault();  // prevent edition
            window.open(event.data.cell.attr('src'), '_blank');
        }
    });

    Sao.View.Tree.CharColumn = Sao.class_(Object, {
        class_: 'column-char',
        init: function(model, attributes) {
            this.type = 'field';
            this.model = model;
            this.field = model.fields[attributes.name];
            this.attributes = attributes;
            this.prefixes = [];
            this.suffixes = [];
            this.header = null;
            this.footers = [];
        },
        get_cell: function() {
            var cell = jQuery('<div/>', {
                'class': this.class_,
                'tabindex': 0
            });
            return cell;
        },
        update_text: function(cell, record) {
            var text = this.field.get_client(record);
            cell.text(text).attr('title', text);
        },
        render: function(record, cell) {
            if (!cell) {
                cell = this.get_cell();
            }
            record.load(this.attributes.name).done(function() {
                this.update_text(cell, record);
                this.field.set_state(record);
                var state_attrs = this.field.get_state_attrs(record);
                if (state_attrs.invisible) {
                    cell.hide();
                } else {
                    cell.show();
                }
            }.bind(this));
            return cell;
        }
    });

    Sao.View.Tree.TextColum = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-text'
    });

    Sao.View.Tree.IntegerColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-integer',
        init: function(model, attributes) {
            Sao.View.Tree.IntegerColumn._super.init.call(this, model, attributes);
            this.factor = Number(attributes.factor || 1);
        },
        get_cell: function() {
            return Sao.View.Tree.IntegerColumn._super.get_cell.call(this);
        },
        update_text: function(cell, record) {
            var value = this.field.get_client(record, this.factor);
            cell.text(value).attr('title', value);
        }
    });

    Sao.View.Tree.FloatColumn = Sao.class_(Sao.View.Tree.IntegerColumn, {
        class_: 'column-float'
    });

    Sao.View.Tree.BooleanColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-boolean',
        get_cell: function() {
            return jQuery('<input/>', {
                'type': 'checkbox',
                'disabled': true,
                'class': this.class_,
                'tabindex': 0
            });
        },
        update_text: function(cell, record) {
            cell.prop('checked', this.field.get(record));
        }
    });

    Sao.View.Tree.Many2OneColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-many2one',
        get_cell: function() {
            var cell = Sao.View.Tree.Many2OneColumn._super.get_cell.call(this);
            cell.append(jQuery('<a/>', {
                'href': '#',
            }));
            return cell;
        },
        update_text: function(cell, record) {
            cell = cell.children('a');
            cell.unbind('click');
            Sao.View.Tree.Many2OneColumn._super.update_text.call(this, cell, record);
            cell.click(function(event) {
                event.stopPropagation();
                var params = {};
                params.model = this.attributes.relation;
                params.res_id = this.field.get(record);
                params.mode = ['form'];
                params.name = this.attributes.string;
                Sao.Tab.create(params);
            }.bind(this));
        }
    });

    Sao.View.Tree.One2OneColumn = Sao.class_(Sao.View.Tree.Many2OneColumn, {
        class_: 'column-one2one'
    });

    Sao.View.Tree.SelectionColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-selection',
        init: function(model, attributes) {
            Sao.View.Tree.SelectionColumn._super.init.call(this, model,
                attributes);
            Sao.common.selection_mixin.init.call(this);
            this.init_selection();
        },
        init_selection: function(key) {
            Sao.common.selection_mixin.init_selection.call(this, key);
        },
        update_selection: function(record, callback) {
            Sao.common.selection_mixin.update_selection.call(this, record,
                this.field, callback);
        },
        update_text: function(cell, record) {
            this.update_selection(record, function() {
                var value = this.field.get(record);
                var prm, text, found = false;
                for (var i = 0, len = this.selection.length; i < len; i++) {
                    if (this.selection[i][0] === value) {
                        found = true;
                        text = this.selection[i][1];
                        break;
                    }
                }
                if (!found) {
                    prm = Sao.common.selection_mixin.get_inactive_selection
                        .call(this, value).then(function(inactive) {
                            return inactive[1];
                        });
                } else {
                    prm = jQuery.when(text);
                }
                prm.done(function(text_value) {
                    cell.text(text_value).attr('title', text_value);
                }.bind(this));
            }.bind(this));
        }
    });

    Sao.View.Tree.ReferenceColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-reference',
        init: function(model, attributes) {
            Sao.View.Tree.ReferenceColumn._super.init.call(this, model,
                attributes);
            Sao.common.selection_mixin.init.call(this);
            this.init_selection();
        },
        init_selection: function(key) {
            Sao.common.selection_mixin.init_selection.call(this, key);
        },
        update_selection: function(record, callback) {
            Sao.common.selection_mixin.update_selection.call(this, record,
                this.field, callback);
        },
        update_text: function(cell, record) {
            this.update_selection(record, function() {
                var value = this.field.get_client(record);
                var model, name, text;
                if (!value) {
                    model = '';
                    name = '';
                } else {
                    model = value[0];
                    name = value[1];
                }
                if (model) {
                    for (var i = 0, len = this.selection.length; i < len; i++) {
                        if (this.selection[i][0] === model) {
                            model = this.selection[i][1];
                            break;
                        }
                    }
                    text = model + ',' + name;
                } else {
                    text = name;
                }
                cell.text(text).attr('title', text);
            }.bind(this));
        }
    });

    Sao.View.Tree.DateColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-date',
        update_text: function(cell, record) {
            var value = this.field.get_client(record);
            var date_format = this.field.date_format(record);
            var text = Sao.common.format_date(date_format, value);
            cell.text(text).attr('title', text);
        }
    });

    Sao.View.Tree.TimeColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-time',
        update_text: function(cell, record) {
            var value = this.field.get_client(record);
            var text = Sao.common.format_time(
                    this.field.time_format(record), value);
            cell.text(text).attr('title', text);
        }
    });

    Sao.View.Tree.TimeDeltaColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-timedelta'
    });

    Sao.View.Tree.One2ManyColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-one2many',
        update_text: function(cell, record) {
            var text = '( ' + this.field.get_client(record).length + ' )';
            cell.text(text).attr('title', text);
        }
    });

    Sao.View.Tree.Many2ManyColumn = Sao.class_(Sao.View.Tree.One2ManyColumn, {
        class_: 'column-many2many'
    });

    Sao.View.Tree.BinaryColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-binary',
        init: function(model, attributes) {
            Sao.View.Tree.BinaryColumn._super.init.call(this, model, attributes);
            this.filename = attributes.filename || null;
        },
        get_cell: function() {
            var cell = Sao.View.Tree.BinaryColumn._super.get_cell.call(this);
            jQuery('<span/>').appendTo(cell);
            return cell;
        },
        update_text: function(cell, record) {
            var size;
            if (this.field.get_size) {
                size = this.field.get_size(record);
            } else {
                size = this.field.get(record).length;
            }
            var text = size? Sao.common.humanize(size) : '';
            cell.children('span').text(text).attr('title', text);
            var button = cell.children('button');
            if (!button.length) {
                button = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-save')
                ).appendTo(cell)
                    .click(record, function(event) {
                        // Prevent editable tree to start edition
                        event.stopPropagation();
                        this.save_as(event.data);
                    }.bind(this));
            }
            if (!size) {
                button.hide();
            } else {
                button.show();
            }
        },
        save_as: function(record) {
            var filename;
            var mimetype = 'application/octet-binary';
            var filename_field = record.model.fields[this.filename];
            if (filename_field) {
                filename = filename_field.get_client(record);
                mimetype = Sao.common.guess_mimetype(filename);
            }
            var prm;
            if (this.field.get_data) {
                prm = this.field.get_data(record);
            } else {
                prm = jQuery.when(this.field.get(record));
            }
            prm.done(function(data) {
                Sao.common.download_file(data, filename);
            }.bind(this));
        },
    });

    Sao.View.Tree.ImageColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-image',
        get_cell: function() {
            var cell = jQuery('<img/>', {
                'class': this.class_,
                'tabindex': 0
            });
            cell.css('width', '100%');
            return cell;
        },
        render: function(record, cell) {
            if (!cell) {
                cell = this.get_cell();
            }
            record.load(this.attributes.name).done(function() {
                var value = this.field.get_client(record);
                if (value) {
                    if (value > Sao.common.BIG_IMAGE_SIZE) {
                        value = jQuery.when(null);
                    } else {
                        value = this.field.get_data(record);
                    }
                } else {
                    value = jQuery.when(null);
                }
                value.done(function(data) {
                    var img_url, blob;
                    if (!data) {
                        img_url = null;
                    } else {
                        blob = new Blob([data]);
                        img_url = window.URL.createObjectURL(blob);
                    }
                    cell.attr('src', img_url);
                }.bind(this));
            }.bind(this));
            return cell;
        }
    });

    Sao.View.Tree.URLColumn = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-url',
        render: function(record, cell) {
            cell = Sao.View.Tree.URLColumn._super.render.call(
                    this, record, cell);
            this.field.set_state(record);
            var state_attrs = this.field.get_state_attrs(record);
            if (state_attrs.readonly) {
                cell.hide();
            } else {
                cell.show();
            }
            return cell;
        }
    });

    Sao.View.Tree.ProgressBar = Sao.class_(Sao.View.Tree.CharColumn, {
        class_: 'column-progressbar',
        get_cell: function() {
            var cell = jQuery('<div/>', {
                'class': this.class_ + ' progress',
                'tabindex': 0
            });
            var progressbar = jQuery('<div/>', {
                'class': 'progress-bar',
                'role': 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': 100
            }).appendTo(cell);
            progressbar.css('min-width: 2em');
            return cell;
        },
        update_text: function(cell, record) {
            var text = this.field.get_client(record, 100);
            if (text) {
                text = Sao.i18n.gettext('%1%', text);
            }
            var value = this.field.get(record) || 0;
            var progressbar = cell.find('.progress-bar');
            progressbar.attr('aria-valuenow', value * 100);
            progressbar.css('width', value * 100 + '%');
            progressbar.text(text).attr('title', text);
        }
    });

    Sao.View.Tree.ButtonColumn = Sao.class_(Object, {
        init: function(view, attributes) {
            this.view = view;
            this.type = 'button';
            this.attributes = attributes;
        },
        render: function(record, el) {
            var button = new Sao.common.Button(this.attributes, el);
            if (!el) {
                button.el.click(
                        [record, button], this.button_clicked.bind(this));
            }
            var fields = jQuery.map(this.view.screen.model.fields,
                function(field, name) {
                    if ((field.description.loading || 'eager') ==
                        'eager') {
                        return name;
                    } else {
                        return undefined;
                    }
                });
            // Wait at least one eager field is loaded before evaluating states
            record.load(fields[0]).done(function() {
                button.set_state(record);
            });
            return button.el;
        },
        button_clicked: function(event) {
            var record = event.data[0];
            var button = event.data[1];
            if (record != this.view.screen.current_record) {
                // Need to raise the event to get the record selected
                return true;
            }
            var states = record.expr_eval(this.attributes.states || {});
            if (states.invisible || states.readonly) {
                return;
            }
            button.el.prop('disabled', true);
            this.view.screen.button(this.attributes).always(function() {
                button.el.prop('disabled', false);
            });
        }
    });

    Sao.View.TreeXMLViewParser.WIDGETS = {
        'biginteger': Sao.View.Tree.IntegerColumn,
        'binary': Sao.View.Tree.BinaryColumn,
        'boolean': Sao.View.Tree.BooleanColumn,
        'callto': Sao.View.Tree.URLColumn,
        'char': Sao.View.Tree.CharColumn,
        'date': Sao.View.Tree.DateColumn,
        'email': Sao.View.Tree.URLColumn,
        'float': Sao.View.Tree.FloatColumn,
        'image': Sao.View.Tree.ImageColumn,
        'integer': Sao.View.Tree.IntegerColumn,
        'many2many': Sao.View.Tree.Many2ManyColumn,
        'many2one': Sao.View.Tree.Many2OneColumn,
        'numeric': Sao.View.Tree.FloatColumn,
        'one2many': Sao.View.Tree.One2ManyColumn,
        'one2one': Sao.View.Tree.One2OneColumn,
        'progressbar': Sao.View.Tree.ProgressBar,
        'reference': Sao.View.Tree.ReferenceColumn,
        'selection': Sao.View.Tree.SelectionColumn,
        'sip': Sao.View.Tree.URLColumn,
        'text': Sao.View.Tree.TextColum,
        'time': Sao.View.Tree.TimeColumn,
        'timedelta': Sao.View.Tree.TimeDeltaColumn,
        'url': Sao.View.Tree.URLColumn,
    };

    Sao.View.EditableTree = {};

    Sao.View.EditableTree.editable_mixin = function(widget) {
        var key_press = function(event_) {
            if ((event_.which == Sao.common.TAB_KEYCODE) ||
                    (event_.which == Sao.common.UP_KEYCODE) ||
                    (event_.which == Sao.common.DOWN_KEYCODE) ||
                    (event_.which == Sao.common.ESC_KEYCODE) ||
                    (event_.which == Sao.common.RETURN_KEYCODE)) {
                this.focus_out();
            }
        };
        widget.el.on('keydown', key_press.bind(widget));
    };

    Sao.View.EditableTree.Char = Sao.class_(Sao.View.Form.Char, {
        class_: 'editabletree-char',
        init: function(view, attributes) {
            Sao.View.EditableTree.Char._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Date = Sao.class_(Sao.View.Form.Date, {
        class_: 'editabletree-date',
        init: function(view, attributes) {
            Sao.View.EditableTree.Date._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Time = Sao.class_(Sao.View.Form.Time, {
        class_: 'editabletree-time',
        init: function(view, attributes) {
            Sao.View.EditableTree.Time._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.TimeDelta = Sao.class_(Sao.View.Form.TimeDelta, {
        class_: 'editabletree-timedelta',
        init: function(view, attributes) {
            Sao.View.EditableTree.TimeDelta._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Integer = Sao.class_(Sao.View.Form.Integer, {
        class_: 'editabletree-integer',
        init: function(view, attributes) {
            Sao.View.EditableTree.Integer._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Float = Sao.class_(Sao.View.Form.Float, {
        class_: 'editabletree-float',
        init: function(view, attributes) {
            Sao.View.EditableTree.Float._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Selection = Sao.class_(Sao.View.Form.Selection, {
        class_: 'editabletree-selection',
        init: function(view, attributes) {
            Sao.View.EditableTree.Selection._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Boolean = Sao.class_(Sao.View.Form.Boolean, {
        class_: 'editabletree-boolean',
        init: function(view, attributes) {
            Sao.View.EditableTree.Boolean._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.Many2One = Sao.class_(Sao.View.Form.Many2One, {
        class_: 'editabletree-many2one',
        init: function(view, attributes) {
            Sao.View.EditableTree.Many2One._super.init.call(
                this, view, attributes);
        },
        key_press: function(event_) {
            if (event_.which == Sao.common.TAB_KEYCODE) {
                this.focus_out();
            } else {
                Sao.View.EditableTree.Many2One._super.key_press.call(this,
                    event_);
            }
        }
    });

    Sao.View.EditableTree.Reference = Sao.class_(Sao.View.Form.Reference, {
        class_: 'editabletree-reference',
        init: function(view, attributes) {
            Sao.View.EditableTree.Reference._super.init.call(
                this, view, attributes);
        },
        key_press: function(event_) {
            if (event_.which == Sao.common.TAB_KEYCODE) {
                this.focus_out();
            } else {
                Sao.View.EditableTree.Reference._super.key_press.call(this,
                    event_);
            }
        }
    });

    Sao.View.EditableTree.One2One = Sao.class_(Sao.View.Form.One2One, {
        class_: 'editabletree-one2one',
        init: function(view, attributes) {
            Sao.View.EditableTree.One2One._super.init.call(
                this, view, attributes);
        },
        key_press: function(event_) {
            if (event_.which == Sao.common.TAB_KEYCODE) {
                this.focus_out();
            } else {
                Sao.View.EditableTree.One2One._super.key_press.call(this,
                    event_);
            }
        }
    });

    Sao.View.EditableTree.One2Many = Sao.class_(Sao.View.EditableTree.Char, {
        class_: 'editabletree-one2many',
        init: function(view, attributes) {
            Sao.View.EditableTree.One2Many._super.init.call(
                this, view, attributes);
        },
        display: function(record, field) {
            if (record) {
                this.el.val('(' + field.get_client(record).length + ')');
            } else {
                this.el.val('');
            }
        },
        key_press: function(event_) {
            if (event_.which == Sao.common.TAB_KEYCODE) {
                this.focus_out();
            }
        },
        set_value: function(record, field) {
        }
    });

    Sao.View.EditableTree.Binary = Sao.class_(Sao.View.Form.Binary, {
        class_: 'editabletree-binary',
        init: function(view, attributes) {
            Sao.View.EditableTree.Binary._super.init.call(
                this, view, attributes);
            Sao.View.EditableTree.editable_mixin(this);
        }
    });

    Sao.View.EditableTree.WIDGETS = {
        'biginteger': Sao.View.EditableTree.Integer,
        'binary': Sao.View.EditableTree.Binary,
        'boolean': Sao.View.EditableTree.Boolean,
        'callto': Sao.View.EditableTree.Char,
        'char': Sao.View.EditableTree.Char,
        'date': Sao.View.EditableTree.Date,
        'email': Sao.View.EditableTree.Char,
        'float': Sao.View.EditableTree.Float,
        'integer': Sao.View.EditableTree.Integer,
        'many2many': Sao.View.EditableTree.Many2Many,
        'many2one': Sao.View.EditableTree.Many2One,
        'numeric': Sao.View.EditableTree.Float,
        'one2many': Sao.View.EditableTree.One2Many,
        'one2one': Sao.View.EditableTree.One2One,
        'reference': Sao.View.EditableTree.Reference,
        'selection': Sao.View.EditableTree.Selection,
        'sip': Sao.View.EditableTree.Char,
        'text': Sao.View.EditableTree.Char,
        'time': Sao.View.EditableTree.Time,
        'timedelta': Sao.View.EditableTree.TimeDelta,
        'url': Sao.View.EditableTree.Char,
    };

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.View.GraphXMLViewParser = Sao.class_(Sao.View.XMLViewParser, {
        init: function(view, exclude_field, fields) {
            Sao.View.GraphXMLViewParser._super.init.call(
                this, view, exclude_field, fields);
            this._xfield = null;
            this._yfields = [];
        },
        _node_attributes: function(node) {
            var node_attrs = {};
            for (var i = 0, len = node.attributes.length; i < len; i++) {
                var attribute = node.attributes[i];
                node_attrs[attribute.name] = attribute.value;
            }
            if (node_attrs.name) {
                if (!node_attrs.string && (node_attrs.name != '#')) {
                    var field = this.field_attrs[node_attrs.name];
                    node_attrs.string = field.string;
                }
            }
            return node_attrs;
        },
        _parse_graph: function(node, attributes) {
            [].forEach.call(node.childNodes, function(child) {
                this.parse(child);
            }.bind(this));
            var Widget = Sao.View.GraphXMLViewParser.WIDGETS[
                attributes.type || 'vbar'];
            var widget = new Widget(this.view, this._xfield, this._yfields);
            this.view.el.append(widget.el);
            this.view.widgets.root = widget;
        },
        _parse_x: function(node, attributes) {
            for (var i = 0; i < node.children.length; i++) {
                this._xfield = this._node_attributes(node.children[i]);
            }
        },
        _parse_y: function(node, attributes) {
            for (var i = 0; i < node.children.length; i++) {
                this._yfields.push(this._node_attributes(node.children[i]));
            }
        }
    });

    Sao.View.Graph = Sao.class_(Sao.View, {
        editable: false,
        view_type: 'graph',
        xml_parser: Sao.View.GraphXMLViewParser,
        init: function(view_id, screen, xml, children_field) {
            this.el = jQuery('<div/>', {
                'class': 'graph'
            });

            Sao.View.Graph._super.init.call(this, view_id, screen, xml);
        },
        display: function() {
            return this.widgets.root.display(this.group);
        }
    });

    Sao.View.Graph.Chart = Sao.class_(Object, {
        _chart_type: undefined,

        init: function(view, xfield, yfields) {
            this.view = view;
            this.xfield = xfield;
            this.yfields = yfields;
            this.el = jQuery('<div/>');
            this.el.uniqueId();
        },
        update_data: function(group) {
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
            var set_data = function(index) {
                return function () {
                    record = group[index];
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
            var load_field = function(record) {
                return function(fname) {
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
            return jQuery.when.apply(jQuery, r_prms).then(function() {
                return data;
            });
        },
        _add_id: function(key, id) {
            if (!(key in this.ids)) {
                this.ids[key] = [];
            }
            this.ids[key].push(id);
        },
        display: function(group) {
            var update_prm = this.update_data(group);
            update_prm.done(function(data) {
                c3.generate(this._c3_config(data));
            }.bind(this));
            return update_prm;
        },
        _c3_config: function(data) {
            var c3_config = {};

            c3_config.bindto = '#' + this.el.attr('id');
            c3_config.data = data;
            c3_config.data.type = this._chart_type;
            c3_config.data.x = 'labels';
            c3_config.data.onclick = this.action.bind(this);

            var type = this.xfield.type;
            if ((type == 'date') || (type == 'datetime')) {
                var format_func, date_format, time_format;
                date_format = Sao.common.date_format(
                    this.view.screen.context.date_format);
                time_format = '%X';
                if (type == 'datetime') {
                    format_func = function(dt) {
                        return Sao.common.format_datetime(date_format,
                                time_format, moment(dt));
                    };
                } else {
                    format_func = function(dt) {
                        return Sao.common.format_date(date_format, moment(dt));
                    };
                }
                c3_config.axis = {
                    x: {
                        type: 'timeseries',
                        tick: {
                            format: format_func,
                        }
                    }
                };
            } else {
                c3_config.axis = {
                    x: {
                        type: 'category',
                    }
                };
            }
            var colors = {};
            for (var i = 0; i < this.yfields.length; i++) {
                var field = this.yfields[i];
                if (field.color) {
                    colors[field.name] = field.color;
                }
            }
            c3_config.data.color = function(color, column) {
                // column is an object when called for legend
                var name = column.id || column;
                return colors[name] || color;
            };
            return c3_config;
        },
        action: function(data, element) {
            var ids = this.ids[this._action_key(data)];
            var ctx = jQuery.extend({}, this.view.screen.group._context);
            delete ctx.active_ids;
            delete ctx.active_id;
            Sao.Action.exec_keyword('graph_open', {
                model: this.view.screen.model_name,
                id: ids[0],
                ids: ids
            }, ctx, false);
        },
        _action_key: function(data) {
            return data.x;
        }
    });

    Sao.View.Graph.VerticalBar = Sao.class_(Sao.View.Graph.Chart, {
        _chart_type: 'bar'
    });

    Sao.View.Graph.HorizontalBar = Sao.class_(Sao.View.Graph.Chart, {
        _chart_type: 'bar',
        _c3_config: function(data) {
            var config = Sao.View.Graph.HorizontalBar._super._c3_config
                .call(this, data);
            config.axis.rotated = true;
        }
    });

    Sao.View.Graph.Line = Sao.class_(Sao.View.Graph.Chart, {
        _chart_type: 'line'
    });

    Sao.View.Graph.Pie = Sao.class_(Sao.View.Graph.Chart, {
        _chart_type: 'pie',
        _c3_config: function(data) {
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
            var type = this.xfield.type;
            if ((type == 'date') || (type == 'datetime')) {
                var date_format = Sao.common.date_format(
                    this.view.screen.context.date_format);
                var datetime_format = date_format + ' %X';
                if (type == 'datetime') {
                    format_func = function(dt) {
                        return Sao.common.format_datetime(datetime_format, dt);
                    };
                } else {
                    format_func = function(dt) {
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
            return config;
        },
        _add_id: function(key, id) {
            var type = this.xfield.type;
            if ((type == 'date') || (type == 'datetime')) {
                var date_format = Sao.common.date_format(
                    this.view.screen.context.date_format);
                var datetime_format = date_format + ' %X';
                if (type == 'datetime') {
                    key = Sao.common.format_datetime(datetime_format, key);
                } else {
                    key = Sao.common.format_date(date_format, key);
                }
            }
            Sao.View.Graph.Pie._super._add_id.call(this, key, id);
        },
        _action_key: function(data) {
            return data.id;
        }
    });

    Sao.View.GraphXMLViewParser.WIDGETS = {
        'hbar': Sao.View.Graph.HorizontalBar,
        'line': Sao.View.Graph.Line,
        'pie': Sao.View.Graph.Pie,
        'vbar': Sao.View.Graph.VerticalBar,
    };
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.View.CalendarXMLViewParser = Sao.class_(Sao.View.XMLViewParser, {
        _parse_calendar: function(node, attributes) {
            [].forEach.call(node.childNodes, function(child) {
                this.parse(child);
            }.bind(this));

            var view_week;
            if (this.view.screen.model.fields[attributes.dtstart]
                .description.type == "datetime") {
                view_week = 'agendaWeek';
            } else {
                view_week = 'basicWeek';
            }
            var view_day;
            if (this.view.screen.model.fields[attributes.dtstart]
                    .description.type == "datetime") {
                view_day = 'agendaDay';
            } else {
                view_day =  'basicDay';
            }
            var defaultview = 'month';
            if (attributes.mode == 'week') {
                defaultview = view_week;
            }
            if (attributes.mode == 'day') {
                defaultview = view_day;
            }
            var header = {
                left: 'today prev,next',
                center: 'title',
                right: 'month,' + view_week + ',' + view_day,
            };
            if (Sao.i18n.rtl) {
                var header_rtl = jQuery.extend({}, header);
                header_rtl.left = header.right;
                header_rtl.right = header.left;
                header = header_rtl;
            }
            this.view.el.fullCalendar({
                defaultView: defaultview,
                header: header,
                timeFormat: 'H:mm',
                events: this.view.get_events.bind(this.view),
                locale: Sao.i18n.getlang().slice(0, 2),
                isRTL: Sao.i18n.rtl,
                themeSystem: 'bootstrap3',
                bootstrapGlyphicons: {
                    'prev': 'chevron-' + (Sao.i18n.rtl? 'right' : 'left'),
                    'next': 'chevron-' + (Sao.i18n.rtl? 'left' : 'right'),
                },
                buttonTextOverride: {
                    'today': Sao.i18n.gettext("Today"),
                    'month': Sao.i18n.gettext("Month"),
                    'week': Sao.i18n.gettext("Week"),
                    'day': Sao.i18n.gettext("Day"),
                },
                eventRender: this.view.event_render.bind(this.view),
                eventResize: this.view.event_resize.bind(this.view),
                eventDrop: this.view.event_drop.bind(this.view),
                eventClick: this.view.event_click.bind(this.view),
                dayClick: this.view.day_click.bind(this.view),
            });
        },
        _parse_field: function(node, attributes) {
            this.view.fields.push(attributes.name);
        },
    });

    Sao.View.Calendar = Sao.class_(Sao.View, {
    /* Fullcalendar works with utc date, the default week start day depends on
       the user language, the events dates are handled by moment object. */
        editable: false,
        view_type: 'calendar',
        xml_parser: Sao.View.CalendarXMLViewParser,
        init: function(view_id, screen, xml) {
            // Used to check if the events are still processing
            this.processing = true;
            this.fields = [];
            this.el = jQuery('<div/>', {
                'class': 'calendar'
            });
            Sao.View.Calendar._super.init.call(this, view_id, screen, xml);
            //this.el.fullCalendar('changeView', defaultview);
        },
        get_colors: function(record) {
            var colors = {};
            colors.text_color = 'black';
            if (this.attributes.color) {
                colors.text_color = record.field_get(
                    this.attributes.color);
            }
            colors.background_color = 'lightblue';
            if (this.attributes.background_color) {
                colors.background_color = record.field_get(
                    this.attributes.background_color);
            }
            return colors;
        },
        display: function() {
            this.el.fullCalendar('render');
            // Don't refetch events from server when get_events is processing
            if (!this.processing) {
                this.el.fullCalendar('refetchEvents');
            }
        },
        insert_event: function(record) {
            var title = this.screen.model.fields[this.fields[0]].get_client(
                record);
            var date_start = record.field_get_client(this.attributes.dtstart);
            var date_end = null;
            if (this.attributes.dtend) {
                date_end = record.field_get_client(this.attributes.dtend);
            }
            var allDay = true;
            var description = [];
            for (var i = 1; i < this.fields.length; i++) {
                description.push(
                    this.screen.model.fields[this.fields[i]].get_client(
                        record));
            }
            description = description.join('\n');
            if (date_start) {
                if (date_end && date_end.isDateTime) {
                    allDay = false;
                } else if (date_end && !date_end.isSame(date_start)  &&
                        this.screen.current_view.view_type == "calendar") {
                    // Add one day to allday event that last more than one day.
                    // http://github.com/fullcalendar/fullcalendar/issues/2909
                    date_end.add(1, 'day');
                }
                // Skip invalid event
                if (date_end && date_start > date_end) {
                    return;
                }
                var colors = this.get_colors(record);
                var values = {
                    title: title,
                    start: date_start,
                    end: date_end,
                    allDay: allDay,
                    editable: true,
                    color: colors.background_color,
                    textColor: colors.text_color,
                    record: record,
                    description: description
                };
                this.events.push(values);
            }
        },
        get_events: function(start, end, timezone, callback) {
            this.processing = true;
            this.start = Sao.DateTime(start.utc());
            this.end = Sao.DateTime(end.utc());
            var prm = jQuery.when();
            if (this.screen.current_view &&
                (this.screen.current_view.view_type != 'form')) {
                var search_string = this.screen.screen_container.get_text();
                prm = this.screen.search_filter(search_string);
            }
            this.events =  [];
            var promisses = [];
            prm.then(function()  {
                this.group.forEach(function(record) {
                    var record_promisses = [];
                    this.fields.forEach(function(name) {
                        record_promisses.push(record.load(name));
                    });
                    var prm = jQuery.when.apply(jQuery, record_promisses).then(
                        function(){
                            this.insert_event(record);
                        }.bind(this));
                    promisses.push(prm);
                }.bind(this));
                return jQuery.when.apply(jQuery, promisses).then(function() {
                    callback(this.events);
                }.bind(this)).always(function() {
                    this.processing = false;
                }.bind(this));
            }.bind(this));
        },
        event_click: function(calEvent, jsEvent, view) {
            // Prevent opening the wrong event while the calendar event clicked
            // when loading
            if (!this.clicked_event) {
                this.clicked_event = true;
                this.screen.current_record = calEvent.record;
                this.screen.switch_view().always(function(){
                    this.clicked_event = false;
                }.bind(this));
            }
        },
        event_drop: function(event, delta, revertFunc, jsEvent, ui, view) {
            var dtstart = this.attributes.dtstart;
            var dtend = this.attributes.dtend;
            var record = event.record;
            var group = record.group;
            var previous_start = record.field_get(dtstart);
            var previous_end = previous_start;
            if (dtend) {
                previous_end = record.field_get(dtend);
            }
            var new_start = event.start;
            var new_end = event.end;
            if (new_end == previous_start || !new_end) {
                new_end = new_start;
            }
            if (previous_start.isDateTime) {
                new_end = Sao.DateTime(new_end.format()).utc();
                new_start = Sao.DateTime(new_start.format()).utc();
            } else if (!previous_start.isSame(previous_end)) {
                // Remove the day that was added at the event end.
                new_end.subtract(1, 'day');
                this.el.fullCalendar('refetchEvents');
            }
            if (previous_start <= new_start) {
                if (dtend) {
                    record.field_set_client(dtend, new_end);
                }
                record.field_set_client(dtstart, new_start);
            } else {
                record.field_set_client(dtstart, new_start);
                if (dtend) {
                    record.field_set_client(dtend, new_end);
                }
            }
            record.save();
        },
        event_resize: function(event, delta, revertFunc, jsEvent, ui, view) {
            var dtend = this.attributes.dtend;
            var record = event.record;
            var group = record.group;
            var previous_end = record.field_get(dtend);
            var new_end = event.end;
            if (previous_end.isDateTime === true) {
                new_end = Sao.DateTime(new_end.format()).utc();
            } else {
                // Remove the day that was added at the event end.
                new_end.subtract(1, 'day');
                this.el.fullCalendar('refetchEvents');
            }
            if (new_end == previous_end || !new_end) {
                new_end = previous_end;
            }
            record.field_set_client(dtend, new_end);
            record.save();
        },
        event_render: function(event, element, view) {
            // The description field is added in the calendar events and the
            // event time is not shown in week view.
            if (this.screen.model.fields.date &&
                   this.screen.view_name == 'calendar') {
                element.find('.fc-time').remove();
            }
            element.append(event.description);
            element.css('white-space', 'pre');
            var model_access = Sao.common.MODELACCESS.get(
            	this.screen.model_name);
            if (!model_access.write) {
                event.editable = false;
            }
        },
        day_click: function(date, jsEvent, view){
            var model_access = Sao.common.MODELACCESS.get(
                this.screen.model_name);
            if (model_access.create) {
                // Set the calendar date to the clicked date
                this.el.fullCalendar('gotoDate', date);
                this.screen.current_record = null;
                this.screen.new_();
            }
        },
        current_domain: function() {
            if (!this.start && !this.end) {
                return [['id', '=', -1]];
            }
            var first_datetime = Sao.DateTime(this.start);
            var last_datetime = Sao.DateTime(this.end);
            var dtstart = this.attributes.dtstart;
            var dtend = this.attributes.dtend || dtstart;
            return ['OR',
                    ['AND', [dtstart, '>=', first_datetime],
                        [dtstart,  '<',  last_datetime]],
                    ['AND', [dtend, '>=', first_datetime],
                        [dtend, '<', last_datetime]],
                    ['AND',  [dtstart, '<', first_datetime],
                        [dtend, '>', last_datetime]]];
        },
        get_displayed_period: function(){
            var DatesPeriod = [];
            if (this.start && this.end) {
                DatesPeriod.push(this.start, this.end);
            }
            return DatesPeriod;
        },
        set_default_date: function(record, selected_date){
            var dtstart = this.attributes.dtstart;
            var field = record.model.fields[dtstart];
            if (field instanceof Sao.field.DateTime) {
                selected_date = Sao.DateTime(selected_date);
            } else if (field instanceof Sao.field.Date) {
                selected_date = Sao.Date(selected_date);
            }
            field.set(record, selected_date);
            return record.on_change([dtstart]).then(function() {
                return record.on_change_with([dtstart]);
            });
        },
        get_selected_date: function(){
            return this.el.fullCalendar('getDate');
        }
    });

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.View.ListGroupViewForm = Sao.class_(Sao.View.Form, {
        editable: true,
        get record() {
            return this._record;
        },
        set record(value) {
            this._record = value;
        }
    });

    Sao.View.ListForm = Sao.class_(Sao.View, {
        view_type: 'list-form',
        init: function(view_id, screen, xml) {
            Sao.View.ListForm._super.init.call(this, view_id, screen, xml);
            this.editable = true;

            this.form_xml = xml;
            this.el = jQuery('<ul/>', {
                'class': 'list-group list-form'
            });
            this._view_forms = [];
        },
        display: function() {
            var record, view_form, view_form_frame, to_delete;
            var deferreds = [];
            var new_elements = [];
            for (var i = 0; i < this.group.length; i++) {
                record = this.group[i];
                view_form = this._view_forms[i];
                if (!view_form) {
                    view_form_frame = this._create_form(record);
                    new_elements.push(view_form_frame);
                    view_form = this._view_forms[this._view_forms.length - 1];
                } else {
                    view_form_frame = view_form.el.parent();
                    view_form.record = record;
                }

                if (~this.group.record_deleted.indexOf(record) ||
                        ~this.group.record_removed.indexOf(record)) {
                    view_form_frame.addClass('disabled');
                } else {
                    view_form_frame.removeClass('disabled');
                }
                if (this.record === record) {
                    view_form_frame.addClass('list-group-item-selected');
                } else {
                    view_form_frame.removeClass('list-group-item-selected');
                }
                deferreds.push(view_form.display());
            }
            if (new_elements.length > 0) {
                this.el.append(new_elements);
            }
            to_delete = this._view_forms.splice(this.group.length);
            jQuery(to_delete.map(function (vf) { return vf.el[0]; }))
                .parent().detach();
            return jQuery.when.apply(jQuery, deferreds);
        },
        _create_form: function(record) {
            var view_form = new Sao.View.ListGroupViewForm(
                this.view_id, this.screen, this.form_xml);
            view_form.record = record;
            this._view_forms.push(view_form);
            var frame = jQuery('<li/>', {
                'class': 'list-group-item list-form-item'
            });
            frame.append(view_form.el);
            frame.click(
                this._view_forms.length - 1, this._select_row.bind(this));
            return frame;
        },
        get selected_records() {
            var view_form, records = [];
            var frame;
            for (var i = 0; i < this._view_forms.length; i++) {
                view_form = this._view_forms[i];
                frame = view_form.el.parent();
                if (frame.hasClass('list-group-item-selected')) {
                    records.push(view_form.record);
                }
            }
            return records;
        },
        set_cursor: function(new_, reset_view) {
            if (new_) {
                this.el.animate({
                    scrollTop: this.el[0].scrollHeight
                });
            }
        },
        select_records: function(from, to) {
            jQuery(this._view_forms.map(function (vf) { return vf.el[0]; }))
                .parent().removeClass('list-group-item-selected');
            if ((from === null) && (to === null)) {
                return;
            }

            if (!from) {
                from = 0;
            }
            if (!to) {
                to = 0;
            }
            if (to < from) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            var select_form = function(form) {
                form.el.parent().addClass('list-group-item-selected');
            };
            this._view_forms.slice(from, to + 1).forEach(select_form);
        },
        _select_row: function(event_) {
            var current_view_form;
            var view_form_idx = event_.data;
            var view_form = this._view_forms[view_form_idx];

            if (event_.shiftKey) {
                for (var i=0; i < this._view_forms.length; i++) {
                    if (this._view_forms[i].record === this.record) {
                        current_view_form = this._view_forms[i];
                        break;
                    }
                }
                this.select_records(i, view_form_idx);
            } else {
                if (!event_.ctrlKey) {
                    this.select_records(null, null);
                }
                this.record = view_form.record;
                view_form.el.parent().toggleClass('list-group-item-selected');
            }
            if (current_view_form) {
                this.record = current_view_form.record;
            }
        }
    });

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Action = {
        report_blob_url: undefined
    };

    Sao.Action.exec_action = function(action, data, context) {
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

        function add_name_suffix(name, context){
            if (!data.model || !data.ids) {
                return jQuery.when(name);
            }
            var max_records = 5;
            var ids = data.ids.slice(0, max_records);
            return Sao.rpc({
                'method': 'model.' + data.model + '.read',
                'params': [ids, ['rec_name'], context]
            }, Sao.Session.current_session).then(function(result) {
                var name_suffix = result.map(function(record){
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
                    action.views.forEach(function(x) {
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
                    decoder.decode( action.pyson_context || '{}'));
                ctx = jQuery.extend(ctx, params.context);

                ctx.context = ctx;
                decoder = new Sao.PYSON.Decoder(ctx);
                params.domain = decoder.decode(action.pyson_domain);
                params.order = decoder.decode(action.pyson_order);
                params.search_value = decoder.decode(
                    action.pyson_search_value || '[]');
                params.tab_domain = [];
                action.domains.forEach(function(element, index) {
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
                name_prm.then(function(name) {
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
                name_prm.done(function(name) {
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
                window.open(action.url, '_blank');
                return;
        }
    };

    Sao.Action.exec_keyword = function(keyword, data, context, warning,
            alwaysask)
    {
        if (warning === undefined) {
            warning = true;
        }
        if (alwaysask === undefined) {
            alwaysask = false;
        }
        var actions = [];
        var model_id = data.id;
        var args = {
            'method': 'model.' + 'ir.action.keyword.get_keyword',
            'params': [keyword, [data.model, model_id], {}]
        };
        var prm = Sao.rpc(args, Sao.Session.current_session);
        var exec_action = function(actions) {
            var keyact = {};
            for (var i in actions) {
                var action = actions[i];
                keyact[action.name.replace(/_/g, '')] = action;
            }
            var prm = Sao.common.selection(
                    Sao.i18n.gettext('Select your action'),
                    keyact, alwaysask);
            return prm.then(function(action) {
                Sao.Action.exec_action(action, data, context);
            }, function() {
                if (jQuery.isEmptyObject(keyact) && warning) {
                    alert(Sao.i18n.gettext('No action defined.'));
                }
            });
        };
        return prm.pipe(exec_action);
    };

    Sao.Action.exec_report = function(attributes) {
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
        prm.done(function(result) {
            var report_type = result[0];
            var data = result[1];
            var print = result[2];
            var name = result[3];

            // TODO direct print
            var file_name = name + '.' + report_type;
            Sao.common.download_file(data, file_name);
        });
    };

    Sao.Action.execute = function(id, data, type, context, keyword) {
        if (!type) {
            Sao.rpc({
                'method': 'model.ir.action.read',
                'params': [[id], ['type'], context]
            }, Sao.Session.current_session).done(function(result) {
                Sao.Action.execute(id, data, result[0].type, context, keyword);
            });
        } else {
            Sao.rpc({
                'method': 'model.' + type + '.search_read',
                'params': [[['action', '=', id]], 0, 1, null, null, context]
            }, Sao.Session.current_session).done(function(result) {
                var action = result[0];
                if (keyword) {
                    var keywords = {
                        'ir.action.report': 'form_report',
                        'ir.action.wizard': 'form_action',
                        'ir.action.act_window': 'form_relate'
                    };
                    if (!action.keyword) {
                        action.keyword = keywords[type];
                    }
                }
                Sao.Action.exec_action(action, data, context);
            });
        }
    };

    Sao.Action.evaluate = function(action, atype, record) {
        action = jQuery.extend({}, action);
        var email = {};
        if ('pyson_email' in action) {
            email = record.expr_eval(action.pyson_email);
            if (jQuery.isEmptyObject(email)) {
                email = {};
            }
        }
        if (!('subject' in email)) {
            email.subject = action.name.replace(/_/g, '');
        }
        action.email = email;
        return action;
    };
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.common = {};

    Sao.common.BACKSPACE_KEYCODE = 8;
    Sao.common.TAB_KEYCODE = 9;
    Sao.common.RETURN_KEYCODE = 13;
    Sao.common.ESC_KEYCODE = 27;
    Sao.common.UP_KEYCODE = 38;
    Sao.common.DOWN_KEYCODE = 40;
    Sao.common.DELETE_KEYCODE = 46;
    Sao.common.F2_KEYCODE = 113;
    Sao.common.F3_KEYCODE = 114;

    Sao.common.SELECTION_NONE = 1;
    Sao.common.SELECTION_SINGLE = 2;
    Sao.common.SELECTION_MULTIPLE = 3;

    Sao.common.BIG_IMAGE_SIZE = Math.pow(10, 6);

    Sao.common.compare = function(arr1, arr2) {
        if (arr1.length != arr2.length) {
            return false;
        }
        for (var i = 0; i < arr1.length; i++) {
            if (arr1[i] instanceof Array && arr2[i] instanceof Array) {
                if (!Sao.common.compare(arr1[i], arr2[i])) {
                    return false;
                }
            } else if (arr1[i] != arr2[i]) {
                return false;
            }
        }
        return true;
    };

    Sao.common.contains = function(array1, array2) {
        for (var i = 0; i < array1.length; i++) {
            if (Sao.common.compare(array1[i], array2)) {
                return true;
            }
        }
        return false;
    };

    // Find the intersection of two arrays.
    // The arrays must be sorted.
    Sao.common.intersect = function(a, b) {
        var ai = 0, bi = 0;
        var result = [];
        while (ai < a.length && bi < b.length) {
            if (a[ai] < b[bi]) {
                ai++;
            } else if (a[ai] > b[bi]) {
                bi++;
            } else {
                result.push(a[ai]);
                ai++;
                bi++;
            }
        }
        return result;
    };

    // Handle click and Return press event
    // If one, the handler is executed at most once for both events
    Sao.common.click_press = function(func, one) {
        return function handler(evt) {
            if (evt.type != 'keypress' ||
                    evt.which == Sao.common.RETURN_KEYCODE) {
                if (one) {
                    jQuery(this).off('click keypress', null, handler);
                }
                return func(evt);
            }
        };
    };

    // Cartesian product
    Sao.common.product = function(array, repeat) {
        repeat = repeat || 1;
        var pools = [];
        var i = 0;
        while (i < repeat) {
            pools = pools.concat(array);
            i++;
        }
        var result = [[]];
        pools.forEach(function(pool) {
            var tmp = [];
            result.forEach(function(x) {
                pool.forEach(function(y) {
                    tmp.push(x.concat([y]));
                });
            });
            result = tmp;
        });
        return result;
    };

    Sao.common.selection = function(title, values, alwaysask) {
        if (alwaysask === undefined) {
            alwaysask = false;
        }
        var prm = jQuery.Deferred();
        if (jQuery.isEmptyObject(values)) {
            prm.fail();
            return prm;
        }
        var keys = Object.keys(values).sort();
        if ((keys.length == 1) && (!alwaysask)) {
            var key = keys[0];
            prm.resolve(values[key]);
            return prm;
        }
        var dialog = new Sao.Dialog(
                title || Sao.i18n.gettext('Your selection:'),
                'selection-dialog');

        keys.forEach(function(k, i) {
            jQuery('<div/>', {
                'class': 'checkbox'
            }).append(jQuery('<label/>')
                .append(jQuery('<input/>', {
                    'type': 'radio',
                    'name': 'selection',
                    'value': i
                }))
                .append(' ' + k))
            .appendTo(dialog.body);
        });
        dialog.body.find('input').first().prop('checked', true);

        jQuery('<button/>', {
            'class': 'btn btn-link',
            'type': 'button'
        }).append(Sao.i18n.gettext('Cancel')).click(function() {
            dialog.modal.modal('hide');
            prm.fail();
        }).appendTo(dialog.footer);
        jQuery('<button/>', {
            'class': 'btn btn-primary',
            'type': 'button'
        }).append(Sao.i18n.gettext('OK')).click(function() {
            var i = dialog.body.find('input:checked').attr('value');
            dialog.modal.modal('hide');
            prm.resolve(values[keys[i]]);
        }).appendTo(dialog.footer);
        dialog.modal.on('hidden.bs.modal', function(e) {
            jQuery(this).remove();
        });
        dialog.modal.modal('show');
        return prm;
    };

    Sao.common.moment_format = function(format) {
        return format
            .replace('%a', 'ddd')
            .replace('%A', 'dddd')
            .replace('%w', 'd')
            .replace('%d', 'DD')
            .replace('%b', 'MMM')
            .replace('%B', 'MMMM')
            .replace('%m', 'MM')
            .replace('%y', 'YY')
            .replace('%Y', 'YYYY')
            .replace('%H', 'HH')
            .replace('%I', 'hh')
            .replace('%p', 'A')
            .replace('%M', 'mm')
            .replace('%S', 'ss')
            .replace('%f', 'SSS')
            .replace('%z', 'ZZ')
            .replace('%Z', 'zz')
            .replace('%j', 'DDDD')
            .replace('%U', 'ww')
            .replace('%W', 'WW')
            .replace('%c', 'llll')
            .replace('%x', 'L')
            .replace('%X', 'LTS')
            .replace('%', '%%')
            ;
    };

    Sao.common.DATE_OPERATORS = [
        ['S', moment.duration(-1, 'seconds')],
        ['s', moment.duration(1, 'seconds')],
        ['I', moment.duration(-1, 'minutes')],
        ['i', moment.duration(1, 'minutes')],
        ['H', moment.duration(-1, 'hours')],
        ['h', moment.duration(1, 'hours')],
        ['D', moment.duration(-1, 'days')],
        ['d', moment.duration(1, 'days')],
        ['W', moment.duration(-1, 'weeks')],
        ['w', moment.duration(1, 'weeks')],
        ['M', moment.duration(-1, 'months')],
        ['m', moment.duration(1, 'months')],
        ['Y', moment.duration(-1, 'years')],
        ['y', moment.duration(1, 'years')],
    ];

    Sao.common.date_format = function(format) {
        if (jQuery.isEmptyObject(format)) {
            format = '%Y-%m-%d';
            if (Sao.Session.current_session) {
                var context = Sao.Session.current_session.context;
                if (context.locale && context.locale.date) {
                    format = context.locale.date;
                }
            }
        }
        return Sao.common.moment_format(format);
    };

    Sao.common.format_time = function(format, date) {
        if (!date) {
            return '';
        }
        return date.format(Sao.common.moment_format(format));
    };

    Sao.common.parse_time = function(format, value) {
        if (jQuery.isEmptyObject(value)) {
            return null;
        }
        var getNumber = function(pattern) {
            var i = format.indexOf(pattern);
            if (~i) {
                var number = parseInt(value.slice(i, i + pattern.length), 10);
                if (!isNaN(number)) {
                    return number;
                }
            }
            return 0;
        };
        return Sao.Time(getNumber('%H'), getNumber('%M'), getNumber('%S'),
                getNumber('%f'));
    };

    Sao.common.format_date = function(date_format, date) {
        if (!date) {
            return '';
        }
        return date.format(Sao.common.moment_format(date_format));
    };

    Sao.common.parse_date = function(date_format, value) {
        var date = moment(value,
               Sao.common.moment_format(date_format));
        if (date.isValid()) {
            date = Sao.Date(date.year(), date.month(), date.date());
        } else {
            date = null;
        }
        return date;
    };

    Sao.common.format_datetime = function(date_format, time_format, date) {
        if (!date) {
            return '';
        }
        return date.format(
                Sao.common.moment_format(date_format + ' ' + time_format));
    };

    Sao.common.parse_datetime = function(date_format, time_format, value) {
        var date = moment(value,
                Sao.common.moment_format(date_format + ' ' + time_format));
        if (date.isValid()) {
            date = Sao.DateTime(date.year(), date.month(), date.date(),
                    date.hour(), date.minute(), date.second(),
                    date.millisecond());
        } else {
            date = null;
        }
        return date;
    };

    Sao.common.timedelta = {};
    Sao.common.timedelta.DEFAULT_CONVERTER = {
        's': 1
    };
    Sao.common.timedelta.DEFAULT_CONVERTER.m =
        Sao.common.timedelta.DEFAULT_CONVERTER.s * 60;
    Sao.common.timedelta.DEFAULT_CONVERTER.h =
        Sao.common.timedelta.DEFAULT_CONVERTER.m * 60;
    Sao.common.timedelta.DEFAULT_CONVERTER.d =
        Sao.common.timedelta.DEFAULT_CONVERTER.h * 24;
    Sao.common.timedelta.DEFAULT_CONVERTER.w =
        Sao.common.timedelta.DEFAULT_CONVERTER.d * 7;
    Sao.common.timedelta.DEFAULT_CONVERTER.M =
        Sao.common.timedelta.DEFAULT_CONVERTER.d * 30;
    Sao.common.timedelta.DEFAULT_CONVERTER.Y =
        Sao.common.timedelta.DEFAULT_CONVERTER.d * 365;
    Sao.common.timedelta._get_separator = function() {
        return {
            Y: Sao.i18n.gettext('Y'),
            M: Sao.i18n.gettext('M'),
            w: Sao.i18n.gettext('w'),
            d: Sao.i18n.gettext('d'),
            h: Sao.i18n.gettext('h'),
            m: Sao.i18n.gettext('m'),
            s: Sao.i18n.gettext('s')
        };
    };
    Sao.common.timedelta.format = function(value, converter) {
        if (!value) {
            return '';
        }
        if (!converter) {
            converter = Sao.common.timedelta.DEFAULT_CONVERTER;
        }
        var text = [];
        value = value.asSeconds();
        var sign = '';
        if (value < 0) {
            sign = '-';
        }
        value = Math.abs(value);
        converter = Object.keys(converter).map(function(key) {
            return [key, converter[key]];
        });
        converter.sort(function(first, second) {
            return second[1] - first[1];
        });
        var values = [];
        var k, v;
        for (var i = 0; i < converter.length; i++) {
            k = converter[i][0];
            v = converter[i][1];
            var part = Math.floor(value / v);
            value -= part * v;
            values.push(part);
        }
        for (i = 0; i < converter.length - 3; i++) {
            k = converter[i][0];
            v = values[i];
            if (v) {
                text.push(v + Sao.common.timedelta._get_separator()[k]);
            }
        }
        if (jQuery(values.slice(-3)).is(function(i, v) { return v; }) ||
                jQuery.isEmptyObject(text)) {
            var time = values.slice(-3, -1);
            time = ('00' + time[0]).slice(-2) + ':' + ('00' + time[1]).slice(-2);
            if (values.slice(-1)[0] || value) {
                time += ':' + ('00' + values.slice(-1)[0]).slice(-2);
            }
            text.push(time);
        }
        text = sign + text.reduce(function(p, c) {
            if (p) {
                return p + ' ' + c;
            } else {
                return c;
            }
        });
        if (value) {
            if (!jQuery(values.slice(-3)).is(function(i, v) { return v; })) {
                // Add space if no time
                text += ' ';
            }
            text += ('' + value.toFixed(6)).slice(1);
        }
        return text;
    };
    Sao.common.timedelta.parse = function(text, converter) {
        if (!text) {
            return null;
        }
        if (!converter) {
            converter = Sao.common.timedelta.DEFAULT_CONVERTER;
        }
        var separators = Sao.common.timedelta._get_separator();
        var separator;
        for (var k in separators) {
            separator = separators[k];
            text = text.replace(separator, separator + ' ');
        }

        var seconds = 0;
        var sec;
        var parts = text.split(' ');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.contains(':')) {
                var subparts = part.split(':');
                var subconverter = [
                    converter.h, converter.m, converter.s];
                for (var j = 0;
                        j < Math.min(subparts.length, subconverter.length);
                        j ++) {
                    var t = subparts[j];
                    var v = subconverter[j];
                    sec = Math.abs(parseFloat(t)) * v;
                    if (!isNaN(sec)) {
                        seconds += sec;
                    }
                }
            } else {
                var found = false;
                for (var key in separators) {
                    separator =separators[key];
                    if (part.endsWith(separator)) {
                        part = part.slice(0, -separator.length);
                        sec = Math.abs(parseFloat(part)) * converter[key];
                        if (!isNaN(sec)) {
                            seconds += sec;
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    sec = Math.abs(parseFloat(part));
                    if (!isNaN(sec)) {
                        seconds += sec;
                    }
                }
            }
        }
        if (text.contains('-')) {
            seconds *= -1;
        }
        return Sao.TimeDelta(null, seconds);
    };

    Sao.common.ModelAccess = Sao.class_(Object, {
        init: function() {
            this.batchnum = 100;
            this._models = [];
            this._access = {};
        },
        load_models: function(refresh) {
            if (!refresh) {
                this._access = {};
            }
            this._models = Sao.rpc({
                'method': 'model.ir.model.list_models',
                'params': [{}]
            }, Sao.Session.current_session, false);
        },
        get: function(model) {
            if (this._access[model] !== undefined) {
                return this._access[model];
            }
            var idx = this._models.indexOf(model);
            if (idx < 0) {
                this.load_models(false);
                idx = this._models.indexOf(model);
            }
            var to_load = this._models.slice(
                Math.max(0, idx - Math.floor(this.batchnum / 2)),
                idx + Math.floor(this.batchnum / 2));
            var access = Sao.rpc({
                'method': 'model.ir.model.access.get_access',
                'params': [to_load, {}]
            }, Sao.Session.current_session, false);
            this._access = jQuery.extend(this._access, access);
            return this._access[model];
        }
    });
    Sao.common.MODELACCESS = new Sao.common.ModelAccess();

    Sao.common.ModelHistory = Sao.class_(Object, {
        init: function() {
            this._models = [];
        },
        load_history: function() {
            this._models = [];
            return Sao.rpc({
                'method': 'model.ir.model.list_history',
                'params': [{}]
            }, Sao.Session.current_session).then(function(models) {
                this._models = models;
            }.bind(this));
        },
        contains: function(model) {
            return ~this._models.indexOf(model);
        }
    });
    Sao.common.MODELHISTORY = new Sao.common.ModelHistory();

    Sao.common.ViewSearch = Sao.class_(Object, {
        init: function() {
            this.encoder = new Sao.PYSON.Encoder();
        },
        load_searches: function() {
            this.searches = {};
            return Sao.rpc({
                'method': 'model.ir.ui.view_search.get_search',
                'params': [{}]
            }, Sao.Session.current_session).then(function(searches) {
                this.searches = searches;
            }.bind(this));
        },
        get: function(model) {
            return this.searches[model] || [];
        },
        add: function(model, name, domain) {
            return Sao.rpc({
                'method': 'model.ir.ui.view_search.create',
                'params': [[{
                    'model': model,
                    'name': name,
                    'domain': this.encoder.encode(domain)
                }], {}]
            }, Sao.Session.current_session).then(function(ids) {
                var id = ids[0];
                if (this.searches[model] === undefined) {
                    this.searches[model] = [];
                }
                this.searches[model].push([id, name, domain]);
            }.bind(this));
        },
        remove: function(model, id) {
            return Sao.rpc({
                'method': 'model.ir.ui.view_search.delete',
                'params': [[id], {}]
            }, Sao.Session.current_session).then(function() {
                for (var i = 0; i < this.searches[model].length; i++) {
                    var domain = this.searches[model][i];
                    if (domain[0] === id) {
                        this.searches[model].splice(i, 1);
                        break;
                    }
                }
            }.bind(this));
        }
    });
    Sao.common.VIEW_SEARCH = new Sao.common.ViewSearch();

    Sao.common.humanize = function(size) {
        var sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        for (var i =0, len = sizes.length; i < len; i++) {
            if (size < 1000) {
                return size.toPrecision(4) + ' ' + sizes[i];
            }
            size /= 1000;
        }
    };

    Sao.common.EvalEnvironment = function(parent_, eval_type) {
        if (eval_type === undefined)
            eval_type = 'eval';
        var environment;
        if (eval_type == 'eval') {
            environment = parent_.get_eval();
        } else {
            environment = {};
            for (var key in parent_.model.fields) {
                var field = parent_.model.fields[key];
                environment[key] = field.get_on_change_value(parent_);
            }
        }
        environment.id = parent_.id;
        if (parent_.group.parent)
            Object.defineProperty(environment, '_parent_' +
                    parent_.group.parent_name, {
                'enumerable': true,
                'get': function() {
                    return Sao.common.EvalEnvironment(parent_.group.parent,
                        eval_type);
                }
            });
        environment.get = function(item, default_) {
            if (this.hasOwnProperty(item))
                return this[item];
            return default_;
        };

        return environment;
    };

    Sao.common.selection_mixin = {};
    Sao.common.selection_mixin.init = function() {
        this.selection = null;
        this.inactive_selection = [];
        this._last_domain = null;
        this._values2selection = {};
        this._domain_cache = {};
        if (this.nullable_widget === undefined) {
            this.nullable_widget = true;
        }
    };
    Sao.common.selection_mixin.init_selection = function(value, callback) {
        if (!value) {
            value = {};
            (this.attributes.selection_change_with || []).forEach(function(e) {
                value[e] = null;
            });
        }
        var key = JSON.stringify(value);
        var selection = this.attributes.selection || [];
        var prm;
        var prepare_selection = function(selection) {
            selection = jQuery.extend([], selection);
            if (this.attributes.sort === undefined || this.attributes.sort) {
                selection.sort(function(a, b) {
                    return a[1].localeCompare(b[1]);
                });
            }
            this.selection = jQuery.extend([], selection);
            if (callback) callback(this.selection);
        };
        if (!(selection instanceof Array) &&
                !(key in this._values2selection)) {
            if (!jQuery.isEmptyObject(this.attributes.selection_change_with)) {
                prm = this.model.execute(selection, [value]);
            } else {
                prm = this.model.execute(selection, []);
            }
            prm = prm.then(function(selection) {
                this._values2selection[key] = selection;
                return selection;
            }.bind(this));
            prm = prm.then(prepare_selection.bind(this));
        } else {
            if (key in this._values2selection) {
                selection = this._values2selection[key];
            }
            prepare_selection.call(this, selection);
            prm = jQuery.when();
        }
        this.inactive_selection = [];
        this._selection_prm = prm;
    };
    Sao.common.selection_mixin.update_selection = function(record, field,
            callback) {
        var _update_selection = function() {
            if (!field) {
                if (callback) {
                    callback(this.selection);
                }
                return;
            }
            var domain = field.get_domain(record);
            if (!('relation' in this.attributes)) {
                var change_with = this.attributes.selection_change_with || [];
                var value = record._get_on_change_args(change_with);
                delete value.id;
                Sao.common.selection_mixin.init_selection.call(this, value,
                        function() {
                            Sao.common.selection_mixin.filter_selection.call(
                                    this, domain, record, field);
                            if (callback) {
                                callback(this.selection);
                            }
                        }.bind(this));
            } else {
                var context = field.get_context(record);
                var jdomain = JSON.stringify([domain, context]);
                if (jdomain in this._domain_cache) {
                    this.selection = this._domain_cache[jdomain];
                    this._last_domain = [domain, context];
                }
                if ((this._last_domain !== null) &&
                        Sao.common.compare(domain, this._last_domain[0]) &&
                        (JSON.stringify(context) ==
                         JSON.stringify(this._last_domain[1]))) {
                    if (callback) {
                        callback(this.selection);
                    }
                    return;
                }
                var prm = Sao.rpc({
                    'method': 'model.' + this.attributes.relation +
                        '.search_read',
                    'params': [domain, 0, null, null, ['rec_name'], context]
                }, record.model.session);
                prm.done(function(result) {
                    var selection = [];
                    result.forEach(function(x) {
                        selection.push([x.id, x.rec_name]);
                    });
                    if (this.nullable_widget) {
                        selection.push([null, '']);
                    }
                    this._last_domain = [domain, context];
                    this._domain_cache[jdomain] = selection;
                    this.selection = jQuery.extend([], selection);
                    if (callback) {
                        callback(this.selection);
                    }
                }.bind(this));
                prm.fail(function() {
                    this._last_domain = null;
                    this.selection = [];
                    if (callback) {
                        callback(this.selection);
                    }
                }.bind(this));
            }
        };
        this._selection_prm.done(_update_selection.bind(this));
    };
    Sao.common.selection_mixin.filter_selection = function(
            domain, record, field) {
        if (jQuery.isEmptyObject(domain)) {
            return;
        }

        var inversion = new Sao.common.DomainInversion();
        var _value_evaluator = function(value) {
            var context = {};
            context[this.field_name] = value[0];
            return inversion.eval_domain(domain, context);
        }.bind(this);

        var _model_evaluator = function(allowed_models) {
            return function(value) {
                return ~allowed_models.indexOf(value[0]) ||
                    jQuery.isEmptyObject(allowed_models);
            };
        };

        var evaluator;
        if (field.description.type == 'reference') {
            var allowed_models = field.get_models(record);
            evaluator = _model_evaluator(allowed_models);
        } else {
            evaluator = _value_evaluator;
        }

        this.selection = this.selection.filter(evaluator);
    };
    Sao.common.selection_mixin.get_inactive_selection = function(value) {
        if (!this.attributes.relation) {
            return jQuery.when([]);
        }
        for (var i = 0, len = this.inactive_selection.length; i < len; i++) {
            if (value == this.inactive_selection[i][0]) {
                return jQuery.when(this.inactive_selection[i]);
            }
        }
        var prm = Sao.rpc({
            'method': 'model.' + this.attributes.relation + '.read',
            'params': [[value], ['rec_name'], {}]
        }, Sao.Session.current_session);
        return prm.then(function(result) {
            this.inactive_selection.push([result[0].id, result[0].rec_name]);
            return [result[0].id, result[0].rec_name];
        }.bind(this));
    };

    Sao.common.Button = Sao.class_(Object, {
        init: function(attributes, el) {
            this.attributes = attributes;
            if (el) {
                this.el = el;
            } else {
                this.el = jQuery('<button/>');
                this.el.append(attributes.string || '');
                if (this.attributes.rule) {
                    this.el.append(' ').append(jQuery('<span/>', {
                        'class': 'badge'
                    }));
                }
            }
            this.icon = this.el.children('img');
            if (!this.icon.length) {
                this.icon = jQuery('<img/>', {
                    'class': 'icon',
                }).prependTo(this.el);
                this.icon.hide();
            }
            this.el.addClass('btn btn-default');
            this.el.attr('type', 'button');
            this.icon.attr('aria-hidden', true);
            this.set_icon(attributes.icon);
        },
        set_icon: function(icon_name) {
            if (!icon_name) {
                this.icon.attr('src', '');
                this.icon.hide();
                return;
            }
            Sao.common.ICONFACTORY.get_icon_url(icon_name).done(function(url) {
                this.icon.attr('src', url);
                this.icon.show();
            }.bind(this));
        },
        set_state: function(record) {
            var states;
            if (record) {
                states = record.expr_eval(this.attributes.states || {});
            } else {
                states = {};
            }
            if (states.invisible) {
                this.el.hide();
            } else {
                this.el.show();
            }
            this.el.prop('disabled', Boolean(states.readonly));
            this.set_icon(states.icon || this.attributes.icon);

            if (this.attributes.rule) {
                var prm;
                if (record) {
                    prm = record.get_button_clicks(this.attributes.name);
                } else {
                    prm = jQuery.when();
                }
                prm.then(function(clicks) {
                    var counter = this.el.children('.badge');
                    var users = [];
                    var tip = '';
                    if (!jQuery.isEmptyObject(clicks)) {
                        for (var u in clicks) {
                            users.push(clicks[u]);
                        }
                        tip = Sao.i18n.gettext('By: ') +
                            users.join(Sao.i18n.gettext(', '));
                    }
                    counter.text(users.length || '');
                    counter.attr('title', tip);
                }.bind(this));
            }

            if (((this.attributes.type === undefined) ||
                        (this.attributes.type === 'class')) && (record)) {
                var parent = record.group.parent;
                while (parent) {
                    if (parent.has_changed()) {
                        this.el.prop('disabled', true);
                        break;
                    }
                    parent = parent.group.parent;
                }
            }
        }
    });

    Sao.common.udlex = Sao.class_(Object, {
        init: function(instream) {

            var Stream = Sao.class_(Object, {
                init: function(stream) {
                    this.stream = stream.split('');
                    this.i = 0;
                },
                read: function(length) {
                    if (length === undefined) {
                        length = 1;
                    }
                    if (this.i >= this.stream.length) {
                        return null;
                    }
                    var value = this.stream
                        .slice(this.i, this.i + length).join();
                    this.i += length;
                    return value;
                }
            });
            this.instream = new Stream(instream);
            this.eof = null;
            this.commenters = '';
            this.nowordchars = [':', '>', '<', '=', '!', '"', ';', '(', ')'];
            this.whitespace = ' \t\r\n';
            this.whitespace_split = false;
            this.quotes = '"';
            this.escape = '\\';
            this.escapedquotes = '"';
            this.state = ' ';
            this.pushback = [];
            this.token = '';
        },
        get_token: function() {
            if (this.pushback.length > 0) {
                return this.pushback.shift();
            }
            var raw = this.read_token();
            return raw;
        },
        read_token: function() {
            var quoted = false;
            var escapedstate = ' ';
            while (true) {
                var nextchar = this.instream.read(1);
                if (this.state === null) {
                    this.token = '';  // past en of file
                    break;
                } else if (this.state == ' ') {
                    if (!nextchar) {
                        this.state = null;  // end of file
                        break;
                    } else if (this.whitespace.contains(nextchar)) {
                        if (this.token || quoted) {
                            break;  // emit current token
                        } else {
                            continue;
                        }
                    } else if (this.commenters.contains(nextchar)) {
                        // TODO readline
                    } else if (this.escape.contains(nextchar)) {
                        escapedstate = 'a';
                        this.state = nextchar;
                    } else if (!~this.nowordchars.indexOf(nextchar)) {
                        this.token = nextchar;
                        this.state = 'a';
                    } else if (this.quotes.contains(nextchar)) {
                        this.state = nextchar;
                    } else if (this.whitespace_split) {
                        this.token = nextchar;
                        this.state = 'a';
                    } else {
                        this.token = nextchar;
                        if (this.token || quoted) {
                            break;  // emit current token
                        } else {
                            continue;
                        }
                    }
                } else if (this.quotes.contains(this.state)) {
                    quoted = true;
                    if (!nextchar) {  // end of file
                        throw 'no closing quotation';
                    }
                    if (nextchar == this.state) {
                        this.state = 'a';
                    } else if (this.escape.contains(nextchar) &&
                        this.escapedquotes.contains(this.state)) {
                        escapedstate = this.state;
                        this.state = nextchar;
                    } else {
                        this.token = this.token + nextchar;
                    }
                } else if (this.escape.contains(this.state)) {
                    if (!nextchar) {  // end of file
                        throw 'no escaped character';
                    }
                    if (this.quotes.contains(escapedstate) &&
                        (nextchar != this.state) &&
                        (nextchar != escapedstate)) {
                        this.token = this.token + this.state;
                    }
                    this.token = this.token + nextchar;
                    this.state = escapedstate;
                } else if (this.state == 'a') {
                    if (!nextchar) {
                        this.state = null;  // end of file
                        break;
                    } else if (this.whitespace.contains(nextchar)) {
                        this.state = ' ';
                        if (this.token || quoted) {
                            break;  // emit current token
                        } else {
                            continue;
                        }
                    } else if (this.commenters.contains(nextchar)) {
                        // TODO
                    } else if (this.quotes.contains(nextchar)) {
                        this.state = nextchar;
                    } else if (this.escape.contains(nextchar)) {
                        escapedstate = 'a';
                        this.state = nextchar;
                    } else if ((!~this.nowordchars.indexOf(nextchar)) ||
                            this.quotes.contains(nextchar) ||
                            this.whitespace_split) {
                        this.token = this.token + nextchar;
                    } else {
                        this.pushback.unshift(nextchar);
                        this.state = ' ';
                        if (this.token) {
                            break;  // emit current token
                        } else {
                            continue;
                        }
                    }
                }
            }
            var result = this.token;
            this.token = '';
            if (!quoted && result === '') {
                result = null;
            }
            return result;
        },
        next: function() {
            var token = this.get_token();
            if (token == this.eof) {
                return null;
            }
            return token;
        }
    });

    Sao.common.DomainParser = Sao.class_(Object, {
        OPERATORS: ['!=', '<=', '>=', '=', '!', '<', '>'],
        init: function(fields, context) {
            this.fields = {};
            this.strings = {};
            this.update_fields(fields);
            this.context = context;
        },
        update_fields: function(fields) {
            for (var name in fields) {
                var field = fields[name];
                if (field.searchable || (field.searchable === undefined)) {
                    this.fields[name] = field;
                    this.strings[field.string.toLowerCase()] = field;
                }
            }
        },
        parse: function(input) {
            try {
                var lex = new Sao.common.udlex(input);
                var tokens = [];
                while (true) {
                    var token = lex.next();
                    if (token === null) {
                        break;
                    }
                    tokens.push(token);
                }
                tokens = this.group_operator(tokens);
                tokens = this.parenthesize(tokens);
                tokens = this.group(tokens);
                tokens = this.operatorize(tokens, 'or');
                tokens = this.operatorize(tokens, 'and');
                tokens = this.parse_clause(tokens);
                return this.simplify(tokens);
            } catch (e) {
                if (e == 'no closing quotation') {
                    return this.parse(input + '"');
                }
                throw e;
            }
        },
        stringable: function(domain) {
            var stringable_ = function(clause) {
                if (!clause) {
                    return true;
                }
                var is_array = function(e) {
                    return e instanceof Array;
                };
                if ((~['AND', 'OR'].indexOf(clause[0]) ||
                            (is_array(clause[0]))) &&
                        clause.slice(1).every(is_array)) {
                    return this.stringable(clause);
                }
                var name = clause[0];
                var value = clause[2];
                if (name.endsWith('.rec_name')) {
                    name = name.slice(0, -9);
                }
                if (name in this.fields) {
                    var field = this.fields[name];
                    if (~['many2one', 'one2one', 'one2many', 'many2many']
                        .indexOf(field.type)) {
                        var test = function(value) {
                            if (field.type == 'many2one') {
                                if ((typeof value != 'string') &&
                                    (value !== null)) {
                                    return false;
                                }
                            } else {
                                if (typeof value != 'string') {
                                    return false;
                                }
                            }
                            return true;
                        };
                        if (value instanceof Array) {
                            return value.every(test);
                        } else {
                            return test(value);
                        }
                    } else {
                        return true;
                    }
                } else if (name == 'rec_name') {
                    return true;
                }
                return false;
            }.bind(this);
            if (!domain) {
                return true;
            }
            if (~['AND', 'OR'].indexOf(domain[0])) {
                domain = domain.slice(1);
            }
            return domain.every(stringable_);
        },
        string: function(domain) {

            var string = function(clause) {
                if (jQuery.isEmptyObject(clause)) {
                    return '';
                }
                if ((typeof clause[0] != 'string') ||
                        ~['AND', 'OR'].indexOf(clause[0])) {
                    return '(' + this.string(clause) + ')';
                }
                var escaped;
                var name = clause[0];
                var operator = clause[1];
                var value = clause[2];
                if (name.endsWith('.rec_name')) {
                    name = name.slice(0, -9);
                }
                if (!(name in this.fields)) {
                    escaped = value.replace('%%', '__');
                    if (escaped.startsWith('%') && escaped.endsWith('%')) {
                        value = value.slice(1, -1);
                    }
                    return this.quote(value);
                }
                var field = this.fields[name];
                var target = null;
                if (clause.length > 3) {
                    target = clause[3];
                }
                if (operator.contains('ilike')) {
                    escaped = value.replace('%%', '__');
                    if (escaped.startsWith('%') && escaped.endsWith('%')) {
                        value = value.slice(1, -1);
                    } else if (!escaped.contains('%')) {
                        if (operator == 'ilike') {
                            operator = '=';
                        } else {
                            operator = '!';
                        }
                        value = value.replace('%%', '%');
                    }
                }
                var def_operator = this.default_operator(field);
                if (def_operator == operator.trim()) {
                    operator = '';
                    if (~this.OPERATORS.indexOf(value)) {
                        // As the value could be interpreted as an operator
                        // the default operator must be forced
                        operator = '"" ';
                    }
                } else if ((operator.contains(def_operator) &&
                            (operator.contains('not') ||
                             operator.contains('!')))) {
                    operator = operator.replace(def_operator, '')
                        .replace('not', '!').trim();
                }
                if (operator.endsWith('in')) {
                    if (operator == 'not in') {
                        operator = '!';
                    } else {
                        operator = '';
                    }
                }
                var formatted_value = this.format_value(field, value, target);
                if (~this.OPERATORS.indexOf(operator) &&
                        ~['char', 'text', 'selection']
                        .indexOf(field.type) &&
                        (value === '')) {
                    formatted_value = '""';
                }
                return (this.quote(field.string) + ': ' +
                        operator + formatted_value);
            };
            string = string.bind(this);

            if (jQuery.isEmptyObject(domain)) {
                return '';
            }
            var nary = ' ';
            if ((domain[0] == 'AND') || (domain[0] == 'OR')) {
                if (domain[0] == 'OR') {
                    nary = ' or ';
                }
                domain = domain.slice(1);
            }
            return domain.map(string).join(nary);
        },
        completion: function(input) {
            var results = [];
            var domain = this.parse(input);
            var closing = 0;
            var i, len;
            for (i=input.length; i>0; i--) {
                if (input[i] == ')' || input[i] == ' ') {
                    break;
                }
                if (input[i] == ')') {
                    closing += 1;
                }
            }
            var endings = this.ending_clause(domain);
            var ending = endings[0];
            var deep_ending = endings[1];
            var deep = deep_ending - closing;
            var string_domain = this.string(domain);

            if (deep > 0) {
                string_domain = string_domain.substring(0,
                        string_domain.length - deep);
            }
            if (string_domain != input) {
                results.push(string_domain);
            }

            var pslice = function(string, depth) {
                if (depth > 0) {
                    return string.substring(0, depth);
                }
                return string;
            };
            var complete, complete_string;
            if (ending !== null && closing === 0) {
                var completes = this.complete(ending);
                for (i=0, len=completes.length; i < len; i++) {
                    complete = completes[i];
                    complete_string = this.string(
                            this.replace_ending_clause(domain, complete));
                    results.push(pslice(complete_string, deep));
                }
            }
            if (input.length > 0) {
                if (input.substr(input.length - 1, 1) != ' ') {
                    return results;
                }
                if (input.length >= 2 ||
                        input.substr(input.length - 2, 1) == ':') {
                    return results;
                }
            }
            var field, operator, value;
            for (var key in this.strings) {
                field = this.strings[key];
                operator = this.default_operator(field);
                value = '';
                if ((operator == 'ilike') || (operator == 'not ilike')) {
                    value = this.likify(value);
                }
                var new_domain = this.append_ending_clause(domain,
                        [field.name, operator, value], deep);
                var new_domain_string = this.string(new_domain);
                results.push(pslice(new_domain_string, deep));
            }
            return results;
        },
        complete: function(clause) {
            var results = [];
            var name, operator, value, target;
            if (clause.length == 1) {
                name = clause[0];
            } else if (clause.length == 3) {
                name = clause[0];
                operator = clause[1];
                value = clause[2];
            } else {
                name = clause[0];
                operator = clause[1];
                value = clause[2];
                target = clause[3];
                if (name.endsWith('.rec_name')) {
                    name = name.substring(0, name.length - 9);
                }
            }
            var escaped;
            if (name == "rec_name") {
                if (operator == "ilike") {
                    escaped = value.replace(/%%/g, '__');
                    if (escaped.startsWith('%') || escaped.endsWith('%')) {
                        value = escaped.substring(1, escaped.length - 1);
                    } else if (~escaped.indexOf('%')) {
                        value = value.replace(/%%/g, '%');
                    }
                    operator = null;
                }
                name = value;
                value = '';
            }
            if (name === undefined || name === null) {
                name = '';
            }
            var field;
            if (!(name.toLowerCase() in this.strings) &&
                    !(name in this.fields)) {
                for (var key in this.strings) {
                    field = this.strings[key];
                    if (field.string.toLowerCase()
                            .startsWith(name.toLowerCase())) {
                        operator = this.default_operator(field);
                        value = '';
                        if (operator == 'ilike') {
                            value = this.likify(value);
                        }
                        results.push([field.name, operator, value]);
                    }
                }
                return results;
            }
            if (name in this.fields) {
                field = this.fields[name];
            } else {
                field = this.strings[name.toLowerCase()];
            }
            if (!operator) {
                operator = this.default_operator(field);
                value = '';
                if ((operator == 'ilike') || (operator == 'not ilike')) {
                    value = this.likify(value);
                }
                results.push([field.name, operator, value]);
            } else {
                var completes = this.complete_value(field, value);
                for (var i=0, len=completes.length; i < len; i++) {
                    results.push([field.name, operator, completes[i]]);
                }
            }
            return results;
        },
        is_leaf: function(element) {
            return ((element instanceof Array) && element.clause);
        },
        ending_clause: function(domain, depth) {
            if (depth === undefined) {
                depth = 0;
            }
            if (domain.length === 0) {
                return [null, depth];
            }
            var last_element = domain[domain.length - 1];
            if (!this.is_leaf(last_element)) {
                return this.ending_clause(last_element, depth + 1);
            }
            return [last_element, depth];
        },
        replace_ending_clause: function(domain, clause) {
            var results = [];
            var i, len;
            for (i = 0, len=domain.length - 1; i < len; i++) {
                results.push(domain[i]);
            }
            if (!this.is_leaf(domain[i])) {
                results = results.concat(this.replace_ending_clause(domain[i],
                            clause));
            } else {
                results.push(clause);
            }
            return results;
        },
        append_ending_clause: function(domain, clause, depth) {
            if (domain.length === 0) {
                return [clause];
            }
            var results = domain.slice(0, -1);
            var last_element = domain[domain.length - 1];
            if (!this.is_leaf(last_element)) {
                results.push(this.append_ending_clause(last_element, clause,
                            depth - 1));
            } else {
                results.push(last_element);
                if (depth === 0) {
                    results.push(clause);
                }
            }
            return results;
        },
        complete_value: function(field, value) {
            var complete_boolean = function() {
                return value ? [true] : [false];
            };

            var complete_selection = function() {
                var results = [];
                var test_value = value !== null ? value : '';
                if (value instanceof Array) {
                    test_value = value[value.length - 1] || '';
                }
                test_value = test_value.replace(/^%*|%*$/g, '');
                var i, len, svalue, test;
                for (i=0, len=field.selection.length; i<len; i++) {
                    svalue = field.selection[i][0];
                    test = field.selection[i][1].toLowerCase();
                    if (test.startsWith(test_value.toLowerCase())) {
                        if (value instanceof Array) {
                            results.push(value.slice(0, -1).concat([svalue]));
                        } else {
                            results.push(svalue);
                        }
                    }
                }
                return results;
            };

            var complete_reference = function() {
                var results = [];
                var test_value = value !== null ? value : '';
                if (value instanceof Array) {
                    test_value = value[value.length - 1];
                }
                test_value = test_value.replace(/^%*|%*$/g, '');
                var i, len, svalue, test;
                for (i=0, len=field.selection.length; i<len; i++) {
                    svalue = field.selection[i][0];
                    test = field.selection[i][1].toLowerCase();
                    if (test.startsWith(test_value.toLowerCase())) {
                        if (value instanceof Array) {
                            results.push(value.slice(0, -1).concat([svalue]));
                        } else {
                            results.push(this.likify(svalue));
                        }
                    }
                }
                return results;
            }.bind(this);

            var complete_datetime = function() {
                return [Sao.Date(), Sao.DateTime().utc()];
            };

            var complete_date = function() {
                return [Sao.Date()];
            };

            var complete_time = function() {
                return [Sao.Time()];
            };

            var completes = {
                'boolean': complete_boolean,
                'selection': complete_selection,
                'reference': complete_reference,
                'datetime': complete_datetime,
                'date': complete_date,
                'time': complete_time
            };

            if (field.type in completes) {
                return completes[field.type]();
            }
            return [];
        },
        group_operator: function(tokens) {
            var cur = tokens[0];
            var nex = null;
            var result = [];
            tokens.slice(1).forEach(function(nex) {
                if ((nex == '=') && cur &&
                    ~this.OPERATORS.indexOf(cur + nex)) {
                    result.push(cur + nex);
                    cur = null;
                } else {
                    if (cur !== null) {
                        result.push(cur);
                    }
                    cur = nex;
                }
            }.bind(this));
            if (cur !== null) {
                result.push(cur);
            }
            return result;
        },
        parenthesize: function(tokens) {
            var result = [];
            var current = result;
            var parent = [];
            tokens.forEach(function(token, i) {
                if (current === undefined) {
                    return;
                }
                if (token == '(') {
                    parent.push(current);
                    current = current[current.push([]) - 1];
                } else if (token == ')') {
                    current = parent.pop();
                } else {
                    current.push(token);
                }
            });
            return result;
        },
        group: function(tokens) {
            var result = [];

            var _group = function(parts) {
                var result = [];
                var push_result = function(part) {
                    var clause = [part];
                    clause.clause = true;
                    result.push(clause);
                };
                var i = parts.indexOf(':');
                if (!~i) {
                    parts.forEach(push_result);
                    return result;
                }
                var sub_group = function(name, lvalue) {
                    return function(part) {
                        if (!jQuery.isEmptyObject(name)) {
                            var clause;
                            if (!jQuery.isEmptyObject(lvalue)) {
                                if (part[0] !== null) {
                                    lvalue.push(part[0]);
                                }
                                clause = name.concat([lvalue]);
                                clause.clause = true;
                                result.push(clause);
                            } else {
                                clause = name.concat(part);
                                clause.clause = true;
                                result.push(clause);
                            }
                            name.splice(0, name.length);
                        } else {
                            result.push(part);
                        }
                    };
                };
                for (var j = 0; j < i; j++) {
                    var name = parts.slice(j, i).join(' ');
                    if (name.toLowerCase() in this.strings) {
                        if (!jQuery.isEmptyObject(parts.slice(0, j))) {
                            parts.slice(0, j).forEach(push_result);
                        } else {
                            push_result(null);
                        }
                        name = [name];
                        // empty string is also the default operator
                        var operators = [''].concat(this.OPERATORS);
                        if (((i + 1) < parts.length) &&
                                (~operators.indexOf(parts[i + 1]))) {
                            name = name.concat([parts[i + 1]]);
                            i += 1;
                        } else {
                            name = name.concat([null]);
                        }
                        var lvalue = [];
                        while ((i + 2) < parts.length) {
                            if (parts[i + 2] == ';') {
                                lvalue.push(parts[i + 1]);
                                i += 2;
                            } else {
                                break;
                            }
                        }
                        _group(parts.slice(i + 1)).forEach(
                                sub_group(name, lvalue));
                        if (!jQuery.isEmptyObject(name)) {
                            var clause;
                            if (!jQuery.isEmptyObject(lvalue)) {
                                clause = name.concat([lvalue]);
                                clause.clause = true;
                                result.push(clause);
                            } else {
                                clause = name.concat([null]);
                                clause.clause = true;
                                result.push(clause);
                            }
                        }
                        break;
                    }
                }
                return result;
            };
            _group = _group.bind(this);

            var parts = [];
            tokens.forEach(function(token) {
                if (this.is_generator(token)) {
                    _group(parts).forEach(function(group) {
                        if (!Sao.common.compare(group, [null])) {
                            result.push(group);
                        }
                    });
                    parts = [];
                    result.push(this.group(token));
                } else {
                    parts.push(token);
                }
            }.bind(this));
            _group(parts).forEach(function(group) {
                if (!Sao.common.compare(group, [null])) {
                    result.push(group);
                }
            });
            return result;
        },
        is_generator: function(value) {
            return (value instanceof Array) && (value.clause === undefined);
        },
        operatorize: function(tokens, operator) {
            var result = [];
            operator = operator || 'or';
            tokens = jQuery.extend([], tokens);
            var test = function(value) {
                if (value instanceof Array) {
                    return Sao.common.compare(value, [operator]);
                } else {
                    return value == operator;
                }
            };
            var cur = tokens.shift();
            while (test(cur)) {
                cur = tokens.shift();
            }
            if (cur === undefined) {
                return result;
            }
            if (this.is_generator(cur)) {
                cur = this.operatorize(cur, operator);
            }
            var nex = null;
            while (!jQuery.isEmptyObject(tokens)) {
                nex = tokens.shift();
                if ((this.is_generator(nex)) && !test(nex)) {
                    nex = this.operatorize(nex, operator);
                }
                if (test(nex)) {
                    nex = tokens.shift();
                    while (test(nex)) {
                        nex = tokens.shift();
                    }
                    if (this.is_generator(nex)) {
                        nex = this.operatorize(nex, operator);
                    }
                    if (nex !== undefined) {
                        cur = [operator.toUpperCase(), cur, nex];
                    } else {
                        if (!test(cur)) {
                            result.push([operator.toUpperCase(), cur]);
                            cur = null;
                        }
                    }
                    nex = null;
                } else {
                    if (!test(cur)) {
                        result.push(cur);
                    }
                    cur = nex;
                }
            }
            if (jQuery.isEmptyObject(tokens)) {
                if ((nex !== null) && !test(nex)) {
                    result.push(nex);
                } else if ((cur !== null) && !test(cur)) {
                    result.push(cur);
                }
            }
            return result;
        },
        _clausify: function(e) {
            e.clause = true;
            return e;
        },
        parse_clause: function(tokens) {
            var result = [];
            tokens.forEach(function(clause) {
                if (this.is_generator(clause)) {
                    result.push(this.parse_clause(clause));
                } else if ((clause === 'OR') || (clause === 'AND')) {
                    result.push(clause);
                } else if ((clause.length == 1) &&
                    !(clause[0] instanceof Array)) {
                    result.push(this._clausify(['rec_name', 'ilike',
                                this.likify(clause[0])]));
                } else if ((clause.length == 3) &&
                    (clause[0].toLowerCase() in this.strings)) {
                    var name = clause[0];
                    var operator = clause[1];
                    var value = clause[2];
                    var field = this.strings[clause[0].toLowerCase()];
                    var field_name = field.name;

                    var target = null;
                    if (field.type == 'reference') {
                        var split = this.split_target_value(field, value);
                        target = split[0];
                        value = split[1];
                        if (target) {
                            field_name += '.rec_name';
                        }
                    }

                    if (!operator) {
                        operator = this.default_operator(field);
                    }
                    if (value instanceof Array) {
                        if (operator == '!') {
                            operator = 'not in';
                        } else {
                            operator = 'in';
                        }
                    }
                    if (operator == '!') {
                        operator = this.negate_operator(
                                this.default_operator(field));
                    }
                    if (~['integer', 'float', 'numeric', 'datetime', 'date',
                            'time'].indexOf(field.type)) {
                        if ((typeof value == 'string') && value.contains('..')) {
                            var values = value.split('..', 2);
                            var lvalue = this.convert_value(field, values[0]);
                            var rvalue = this.convert_value(field, values[1]);
                            result.push([
                                    this._clausify([field_name, '>=', lvalue]),
                                    this._clausify([field_name, '<=', rvalue])
                                    ]);
                            return;
                        }
                    }
                    if (value instanceof Array) {
                        value = value.map(function(v) {
                            return this.convert_value(field, v);
                        }.bind(this));
                        if (~['many2one', 'one2many', 'many2many', 'one2one',
                            'many2many', 'one2one'].indexOf(field.type)) {
                            field_name += '.rec_name';
                        }
                    } else {
                        value = this.convert_value(field, value);
                    }
                    if (operator.contains('like')) {
                        value = this.likify(value);
                    }
                    if (target) {
                        result.push(this._clausify(
                            [field_name, operator, value, target]));
                    } else {
                        result.push(this._clausify(
                            [field_name, operator, value]));
                    }
                }
            }.bind(this));
            return result;
        },
        likify: function(value) {
            if (!value) {
                return '%';
            }
            var escaped = value.replace('%%', '__');
            if (escaped.contains('%')) {
                return value;
            } else {
                return '%' + value + '%';
            }
        },
        quote: function(value) {
            if (typeof value != 'string') {
                return value;
            }
            if (value.contains('\\')) {
                value = value.replace(new RegExp('\\\\', 'g'), '\\\\');
            }
            if (value.contains('"')) {
                value = value.replace(new RegExp('"', 'g'), '\\"');
            }
            var tests = [':', ' ', '(', ')'].concat(this.OPERATORS);
            for (var i = 0; i < tests.length; i++) {
                var test = tests[i];
                if (value.contains(test)) {
                    return '"' + value + '"';
                }
            }
            return value;
        },
        default_operator: function(field) {
            if (~['char', 'text', 'many2one', 'many2many', 'one2many',
                    'reference'].indexOf(field.type)) {
                return 'ilike';
            } else {
                return '=';
            }
        },
        negate_operator: function(operator) {
            switch (operator) {
                case 'ilike':
                    return 'not ilike';
                case '=':
                    return '!=';
                case 'in':
                    return 'not in';
            }
        },
        time_format: function(field) {
            return new Sao.PYSON.Decoder({}).decode(field.format);
        },
        split_target_value: function(field, value) {
            var target = null;
            if (typeof value == 'string') {
                for (var i = 0; i < field.selection.length; i++) {
                    var selection = field.selection[i];
                    var key = selection[0];
                    var text = selection[1];
                    if (value.toLowerCase().startsWith(
                                text.toLowerCase() + ',')) {
                        target = key;
                        value = value.slice(text.length + 1);
                        break;
                    }
                }
            }
            return [target, value];
        },
        convert_value: function(field, value) {
            var convert_selection = function() {
                if (typeof value == 'string') {
                    for (var i = 0; i < field.selection.length; i++) {
                        var selection = field.selection[i];
                        var key = selection[0];
                        var text = selection[1];
                        if (value.toLowerCase() == text.toLowerCase()) {
                            return key;
                        }
                    }
                }
                return value;
            };

            var converts = {
                'boolean': function() {
                    if (typeof value == 'string') {
                        return [Sao.i18n.gettext('y'),
                            Sao.i18n.gettext('Yes'),
                            Sao.i18n.gettext('True'),
                            Sao.i18n.gettext('t'),
                            '1'].some(
                                function(test) {
                                    return test.toLowerCase().startsWith(
                                        value.toLowerCase());
                                });
                    } else {
                        return Boolean(value);
                    }
                },
                'float': function() {
                    var factor = Number(field.factor || 1);
                    var result = Number(value);
                    if (isNaN(result) || value === '' || value === null) {
                        return null;
                    } else {
                        return result / factor;
                    }
                },
                'integer': function() {
                    var factor = Number(field.factor || 1, 10);
                    var result = parseInt(value, 10);
                    if (isNaN(result)) {
                        return null;
                    } else {
                        return result / factor;
                    }
                },
                'numeric': function() {
                    var factor = Number(field.factor || 1);
                    var result = Number(value);
                    if (isNaN(result.valueOf()) ||
                            value === '' || value === null) {
                        return null;
                    } else {
                        return new Sao.Decimal(result / factor);
                    }
                },
                'selection': convert_selection,
                'reference': convert_selection,
                'datetime': function() {
                    var result = Sao.common.parse_datetime(
                            Sao.common.date_format(),
                            this.time_format(field),
                            value);
                    return result;
                }.bind(this),
                'date': function() {
                    return Sao.common.parse_date(
                            Sao.common.date_format(),
                            value);
                },
                'time': function() {
                    try {
                        return Sao.common.parse_time(this.time_format(field),
                                value);
                    } catch (e) {
                        return null;
                    }
                }.bind(this),
                'timedelta': function() {
                    var converter = null;
                    if (field.converter) {
                        converter = this.context[field.converter];
                    }
                    return Sao.common.timedelta.parse(value, converter);
                }.bind(this),
                'many2one': function() {
                    if (value === '') {
                        return null;
                    } else {
                        return value;
                    }
                }
            };
            var func = converts[field.type];
            if (func) {
                return func();
            } else {
                return value;
            }
        },
        format_value: function(field, value, target) {
            if (target === undefined) {
                target = null;
            }
            var format_float = function() {
                if (!value && value !== 0 && value !== new Sao.Decimal(0)) {
                    return '';
                }
                var factor = Number(field.factor || 1);
                var digit = String(value * factor)
                    .replace(/0+$/, '').split('.')[1];
                if (digit) {
                    digit = digit.length;
                } else {
                    digit = 0;
                }
                return (value * factor).toFixed(digit);
            };
            var format_selection = function() {
                for (var i = 0; i < field.selection.length; i++) {
                    if (field.selection[i][0] == value) {
                        return field.selection[i][1];
                    }
                }
                return value || '';
            };

            var format_reference = function() {
                if (!target) {
                    return format_selection();
                }
                for (var i = 0; i < field.selection.length; i++) {
                    if (field.selection[i][0] == target) {
                        target = field.selection[i][1];
                        break;
                    }
                }
                return target + ',' + value;
            };

            var converts = {
                'boolean': function() {
                    if (value) {
                        return Sao.i18n.gettext('True');
                    } else {
                        return Sao.i18n.gettext('False');
                    }
                },
                'integer': function() {
                    var factor = Number(field.factor || 1);
                    if (value || value === 0) {
                        return '' + parseInt(parseInt(value, 10) * factor, 10);
                    } else {
                        return '';
                    }
                },
                'float': format_float,
                'numeric': format_float,
                'selection': format_selection,
                'reference': format_reference,
                'datetime': function() {
                    if (!value) {
                        return '';
                    }
                    if (value.isDate ||
                            !(value.hour() ||
                                value.minute() ||
                                value.second())) {
                        return Sao.common.format_date(
                                Sao.common.date_format(),
                                value);
                    }
                    return Sao.common.format_datetime(
                            Sao.common.date_format(),
                            this.time_format(field),
                            value);
                }.bind(this),
                'date': function() {
                    return Sao.common.format_date(
                            Sao.common.date_format(),
                            value);
                },
                'time': function() {
                    if (!value) {
                        return '';
                    }
                    return Sao.common.format_time(
                            this.time_format(field),
                            value);
                }.bind(this),
                'timedelta': function() {
                    if (!value || !value.valueOf()) {
                        return '';
                    }
                    var converter = null;
                    if (field.converter) {
                        converter = this.context[field.converter];
                    }
                    return Sao.common.timedelta.format(value, converter);
                }.bind(this),
                'many2one': function() {
                    if (value === null) {
                        return '';
                    } else {
                        return value;
                    }
                }
            };
            if (value instanceof Array) {
                return value.map(function(v) {
                    return this.format_value(field, v);
                }.bind(this)).join(';');
            } else {
                var func = converts[field.type];
                if (func) {
                    return this.quote(func(value));
                } else if (value === null) {
                    return '';
                } else {
                    return this.quote(value);
                }
            }
        },
        simplify: function(value) {
            if ((value instanceof Array) && !this.is_leaf(value)) {
                if ((value.length == 1) && (value[0] instanceof Array) &&
                        ((value[0][0] == 'AND') || (value[0][0] == 'OR') ||
                         (value[0][0] instanceof Array))) {
                    return this.simplify(value[0]);
                } else if ((value.length == 2) &&
                        ((value[0] == 'AND') || (value[0] == 'OR')) &&
                        (value[1] instanceof Array)) {
                    return this.simplify(value[1]);
                } else if ((value.length == 3) &&
                        ((value[0] == 'AND') || (value[0] == 'OR')) &&
                        (value[1] instanceof Array) &&
                        (value[0] == value[1][0])) {
                    value = this.simplify(value[1]).concat([value[2]]);
                }
                return value.map(this.simplify.bind(this));
            }
            return value;
        }
    });

    Sao.common.DomainInversion = Sao.class_(Object, {
        and: function(a, b) {return a && b;},
        or: function(a, b) {return a || b;},
        OPERATORS: {
            '=': function(a, b) {
                return Sao.common.DomainInversion.equals(a, b);
            },
            '>': function(a, b) {return (a > b);},
            '<': function(a, b) {return (a < b);},
            '<=': function(a, b) {return (a <= b);},
            '>=': function(a, b) {return (a >= b);},
            '!=': function(a, b) {
                return !Sao.common.DomainInversion.equals(a, b);
            },
            'in': function(a, b) {
                return Sao.common.DomainInversion.in_(a, b);
            },
            'not in': function(a, b) {
                return !Sao.common.DomainInversion.in_(a, b);
            },
            'like': function(a, b) {
                return Sao.common.DomainInversion.sql_like(a, b, false);
            },
            'ilike': function(a, b) {
                return Sao.common.DomainInversion.sql_like(a, b, true);
            },
            'not like': function(a, b) {
                return !Sao.common.DomainInversion.sql_like(a, b, false);
            },
            'not ilike': function(a, b) {
                return !Sao.common.DomainInversion.sql_like(a, b, true);
            },
            // Those operators are not supported (yet ?)
            'child_of': function() {return true;},
            'not child_of': function() {return true;}
        },
        locale_part: function(expression, field_name, locale_name) {
            if (locale_name === undefined) {
                locale_name = 'id';
            }
            if (expression === field_name) {
                return locale_name;
            }
            if (expression.contains('.')) {
                return expression.split('.').slice(1).join('.');
            }
            return expression;
        },
        is_leaf: function(expression) {
            return ((expression instanceof Array) &&
                (expression.length > 2) &&
                (typeof expression[1] == 'string'));
        },
        constrained_leaf: function(part, boolop) {
            if (boolop === undefined) {
                boolop = this.and;
            }
            var field = part[0];
            var operand = part[1];
            var value = part[2];
            if ((operand === '=') & (boolop === this.and)) {
                // We should consider that other domain inversion will set a
                // correct value to this field
                return true;
            }
            return false;
        },
        eval_leaf: function(part, context, boolop) {
            if (boolop === undefined) {
                boolop = this.and;
            }
            var field = part[0];
            var operand = part[1];
            var value = part[2];
            if (field.contains('.')) {
                // In the case where the leaf concerns a m2o then having a
                // value in the evaluation context is deemed suffisant
                return Boolean(context[field.split('.')[0]]);
            }
            var context_field = context[field];
            if ((context_field && context_field._isAMomentObject) && !value) {
                if (context_field.isDateTime) {
                    value = Sao.DateTime.min;
                } else {
                    value = Sao.Date.min;
                }
            }
            if ((value && value._isAMomentObject) && !context_field) {
                if (value.isDateTime) {
                    context_field = Sao.DateTime.min;
                } else {
                    context_field = Sao.Date.min;
                }
            }
            if ((context_field instanceof Array) & (value === null)) {
                value = [];
            }
            if ((typeof context_field == 'string') &&
                    (value instanceof Array) && value.length == 2) {
                value = value.join(',');
            } else if ((context_field instanceof Array) &&
                    (typeof value == 'string') && context_field.length == 2) {
                context_field = context_field.join(',');
            }
            if (~['=', '!='].indexOf(operand) &&
                    context_field instanceof Array &&
                    typeof value == 'number') {
                operand = {
                    '=': 'in',
                    '!=': 'not in'
                }[operand];
            }
            if (operand in this.OPERATORS) {
                return this.OPERATORS[operand](context_field, value);
            } else {
                return true;
            }
        },
        inverse_leaf: function(domain) {
            if (~['AND', 'OR'].indexOf(domain)) {
                return domain;
            } else if (this.is_leaf(domain)) {
                if (domain[1].contains('child_of') && !domain[0].contains('.')) {
                    if (domain.length == 3) {
                        return domain;
                    } else {
                        return [domain[3]].concat(domain.slice(1));
                    }
                }
                return domain;
            } else {
                return domain.map(this.inverse_leaf.bind(this));
            }
        },
        filter_leaf: function(domain, field, model) {
            if (~['AND', 'OR'].indexOf(domain)) {
                return domain;
            } else if (this.is_leaf(domain)) {
                if (domain[0].startsWith(field) && (domain.length > 3)) {
                    if (domain[3] !== model) {
                        return ['id', '=', null];
                    }
                }
                return domain;
            } else {
                return domain.map(function(d) {
                    return this.filter_leaf(d, field, model);
                }.bind(this));
            }
        },
        eval_domain: function(domain, context, boolop) {
            if (boolop === undefined) {
                boolop = this.and;
            }
            if (this.is_leaf(domain)) {
                return this.eval_leaf(domain, context, boolop);
            } else if (jQuery.isEmptyObject(domain) && boolop == this.and) {
                return true;
            } else if (jQuery.isEmptyObject(domain) && boolop == this.or) {
                return false;
            } else if (domain[0] == 'AND') {
                return this.eval_domain(domain.slice(1), context);
            } else if (domain[0] == 'OR') {
                return this.eval_domain(domain.slice(1), context, this.or);
            } else {
                return boolop(this.eval_domain(domain[0], context),
                        this.eval_domain(domain.slice(1), context, boolop));
            }
        },
        localize_domain: function(domain, field_name, strip_target) {
            if (~['AND', 'OR', true, false].indexOf(domain)) {
                return domain;
            } else if (this.is_leaf(domain)) {
                if (domain[1].contains('child_of')) {
                    if (domain[0].split('.').length > 1) {
                        var target = domain[0].split('.').slice(1).join('.');
                        return [target].concat(domain.slice(1));
                    }
                    if (domain.length == 3) {
                        return domain;
                    } else {
                        return [domain[3]].concat(domain.slice(1, -1));
                    }
                }
                var local_name = 'id';
                if (typeof domain[2] == 'string') {
                    local_name = 'rec_name';
                }
                var n = strip_target ? 3 : 4;
                return [this.locale_part(domain[0], field_name, local_name)]
                    .concat(domain.slice(1, n)).concat(domain.slice(4));
            } else {
                return domain.map(function(e) {
                    return this.localize_domain(e, field_name, strip_target);
                }.bind(this));
            }
        },
        prepare_reference_domain: function(domain, reference) {
            if (~['AND', 'OR'].indexOf(domain)) {
                return domain;
            } else if (this.is_leaf(domain)) {
                if ((domain[0].split('.').length > 1) &&
                        (domain.length > 3)) {
                    var parts = domain[0].split('.');
                    var local_name = parts[0];
                    var target_name = parts.slice(1).join('.');

                    if (local_name == reference) {
                        var where = [];
                        where.push(target_name);
                        where = where.concat(
                            domain.slice(1, 3), domain.slice(4));
                        return where;
                    }
                    return domain;
                }
                return domain;
            } else {
                return domain.map(function(d) {
                    return this.prepare_reference_domain(d, reference);
                }.bind(this));
            }
        },
        extract_reference_models: function(domain, field_name) {
            if (~['AND', 'OR'].indexOf(domain)) {
                return [];
            } else if (this.is_leaf(domain)) {
                var local_part = domain[0].split('.', 1)[0];
                if ((local_part == field_name) &&
                        (domain.length > 3)) {
                    return [domain[3]];
                }
                return [];
            } else {
                var models = [];
                domain.map(function(d) {
                    var new_models = this.extract_reference_models(
                        d, field_name);
                    for (var i=0, len=new_models.length; i < len; i++) {
                        var model = new_models[i];
                        if (!~models.indexOf(model)) {
                            models.push(model);
                        }
                    }
                }.bind(this));
                return models;
            }
        },
        simplify: function(domain) {
            if (this.is_leaf(domain)) {
                return domain;
            } else if (~['OR', 'AND'].indexOf(domain)) {
                return domain;
            } else if ((domain instanceof Array) && (domain.length == 1) &&
                    (~['OR', 'AND'].indexOf(domain[0]))) {
                return [];
            } else if ((domain instanceof Array) && (domain.length == 1) &&
                    (!this.is_leaf(domain[0]))) {
                return this.simplify(domain[0]);
            } else if ((domain instanceof Array) && (domain.length == 2) &&
                    ~['AND', 'OR'].indexOf(domain[0])) {
                return [this.simplify(domain[1])];
            } else {
                return domain.map(this.simplify.bind(this));
            }
        },
        merge: function(domain, domoperator) {
            if (jQuery.isEmptyObject(domain) ||
                    ~['AND', 'OR'].indexOf(domain)) {
                return [];
            }
            var domain_type = domain[0] == 'OR' ? 'OR' : 'AND';
            if (this.is_leaf(domain)) {
                return [domain];
            } else if (domoperator === undefined) {
                return [domain_type].concat([].concat.apply([],
                        domain.map(function(e) {
                            return this.merge(e, domain_type);
                        }.bind(this))));
            } else if (domain_type == domoperator) {
                return [].concat.apply([], domain.map(function(e) {
                    return this.merge(e, domain_type);
                }.bind(this)));
            } else {
                // without setting the domoperator
                return [this.merge(domain)];
            }
        },
        concat: function(domains, domoperator) {
            var result = [];
            if (domoperator) {
                result.push(domoperator);
            }
            domains.forEach(function append(domain) {
                if (!jQuery.isEmptyObject(domain)) {
                    result.push(domain);
                }
            });
            return this.simplify(this.merge(result));
        },
        unique_value: function(domain) {
            if ((domain instanceof Array) &&
                    (domain.length == 1)) {
                domain = domain[0];
                var name = domain[0];
                var value = domain[2];
                var count = 0;
                if (domain.length == 4 && name.endsWith('.id')) {
                    count = 1;
                    var model = domain[3];
                    value = [model, value];
                }
                if ((name.split('.').length - 1) == count &&
                        (domain[1] == '=')) {
                    return [true, domain[1], value];
                }
            }
            return [false, null, null];
        },
        parse: function(domain) {
            var And = Sao.common.DomainInversion.And;
            var Or = Sao.common.DomainInversion.Or;
            if (this.is_leaf(domain)) {
                return domain;
            } else if (jQuery.isEmptyObject(domain)) {
                return new And([]);
            } else if (domain[0] === 'OR') {
                return new Or(domain.slice(1));
            } else {
                var begin = 0;
                if (domain[0] === 'AND') {
                    begin = 1;
                }
                return new And(domain.slice(begin));
            }
        },
        domain_inversion: function(domain, symbol, context) {
            if (context === undefined) {
                context = {};
            }
            var expression = this.parse(domain);
            if (!~expression.variables.indexOf(symbol)) {
                return true;
            }
            return expression.inverse(symbol, context);
        }
    });
    Sao.common.DomainInversion.equals = function(a, b) {
        if ((a instanceof Array) && (b instanceof Array)) {
            return Sao.common.compare(a, b);
        } else if (moment.isMoment(a) && moment.isMoment(b)) {
            return ((a.isDate == b.isDate) &&
                (a.isDateTime == b.isDateTime) &&
                (a.valueOf() == b.valueOf()));
        } else if ((a instanceof Number) || (b instanceof Number)) {
            return (Number(a) === Number(b));
        } else {
            return (a === b);
        }
    };
    Sao.common.DomainInversion.in_ = function(a, b) {
        if (a instanceof Array) {
            if (b instanceof Array) {
                for (var i = 0, len = a.length; i < len; i++) {
                    if (~b.indexOf(a[i])) {
                        return true;
                    }
                }
                return false;
            } else {
                return Boolean(~a.indexOf(b));
            }
        } else {
            return Boolean(~b.indexOf(a));
        }
    };
    Sao.common.DomainInversion.sql_like = function(value, pattern, ignore_case)
    {
        var escape = false;
        var chars = [];
        var splitted = pattern.split(/(.|\\)/);
        var char;
        for (var i=1, len=splitted.length; i < len; i = i+2) {
            char = splitted[i];
            if (escape) {
                if ((char == '%') || (char == '_')) {
                    chars.push(char);
                } else {
                    chars.push('\\', char);
                }
                escape = false;
            } else if (char == '\\') {
                escape = true;
            } else if (char == '_') {
                chars.push('.');
            } else if (char == '%') {
                chars.push('.*');
            } else {
                chars.push(char);
            }
        }

        if (!pattern.startsWith('%')) {
            chars.splice(0, 0, '^');
        }
        if (!pattern.endsWith('%')) {
            chars.push('$');
        }

        var flags = ignore_case ? 'i' : '';
        var regexp = new RegExp(chars.join(''), flags);
        return regexp.test(value);
    };
    Sao.common.DomainInversion.And = Sao.class_(Object, {
        init: function(expressions) {
            this.domain_inversion = new Sao.common.DomainInversion();
            this.branches = expressions.map(this.domain_inversion.parse.bind(
                    this.domain_inversion));
            this.variables = [];
            for (var i = 0, len = this.branches.length; i < len; i++) {
                var expression = this.branches[i];
                if (this.domain_inversion.is_leaf(expression)) {
                    this.variables.push(this.base(expression[0]));
                } else if (expression instanceof
                    Sao.common.DomainInversion.And) {
                    this.variables = this.variables.concat(
                        expression.variables);
                }
            }
        },
        base: function(expression) {
            if (!expression.contains('.')) {
                return expression;
            } else {
                return expression.split('.')[0];
            }
        },
        inverse: function(symbol, context) {
            var DomainInversion = Sao.common.DomainInversion;
            var result = [];
            for (var i = 0, len = this.branches.length; i < len; i++) {
                var part = this.branches[i];
                if (part instanceof DomainInversion.And) {
                    var part_inversion = part.inverse(symbol, context);
                    var evaluated = typeof part_inversion == 'boolean';
                    if (!evaluated) {
                        result.push(part_inversion);
                    } else if (part_inversion) {
                        continue;
                    } else {
                        return false;
                    }
                } else if (this.domain_inversion.is_leaf(part) &&
                        (this.base(part[0]) === symbol)) {
                    result.push(part);
                } else {
                    var field = part[0];
                    if ((!(field in context)) ||
                        ((field in context) &&
                            (this.domain_inversion.eval_leaf(
                                part, context, this.domain_inversion.and) ||
                                this.domain_inversion.constrained_leaf(
                                    part, this.domain_inversion.and)))) {
                        result.push(true);
                    } else {
                        return false;
                    }
                }
            }
            result = result.filter(function(e) {
                return e !== true;
            });
            if (jQuery.isEmptyObject(result)) {
                return true;
            } else {
                return this.domain_inversion.simplify(result);
            }
        }
    });
    Sao.common.DomainInversion.Or = Sao.class_(Sao.common.DomainInversion.And, {
        inverse: function(symbol, context) {
            var DomainInversion = Sao.common.DomainInversion;
            var result = [];
            if (!~this.variables.indexOf(symbol) &&
                !jQuery.isEmptyObject(this.variables.filter(function(e) {
                    return !(e in context);
                }))) {
                // In this case we don't know anything about this OR part, we
                // consider it to be True (because people will have the
                // constraint on this part later).
                return true;
            }
            for (var i = 0, len = this.branches.length; i < len; i++) {
                var part = this.branches[i];
                if (part instanceof DomainInversion.And) {
                    var part_inversion = part.inverse(symbol, context);
                    var evaluated = typeof part_inversion == 'boolean';
                    if (!~this.variables.indexOf(symbol)) {
                        if (evaluated && part_inversion) {
                            return true;
                        }
                        continue;
                    }
                    if (!evaluated) {
                        result.push(part_inversion);
                    } else if (part_inversion) {
                        return true;
                    } else {
                        continue;
                    }
                } else if (this.domain_inversion.is_leaf(part) &&
                        (this.base(part[0]) == symbol)) {
                    result.push(part);
                } else {
                    var field = part[0];
                    field = this.base(field);
                    if ((field in context) &&
                        (this.domain_inversion.eval_leaf(
                            part, context, this.domain_inversion.or)) ||
                        this.domain_inversion.constrained_leaf(
                            part, this.domain_inversion.or)) {
                        return true;
                    } else if ((field in context) &&
                            !this.domain_inversion.eval_leaf(part, context,
                                this.domain_inversion.or)) {
                        result.push(false);
                    }
                }
            }
            result = result.filter(function(e) {
                return e !== false;
            });
            if (jQuery.isEmptyObject(result)) {
                return false;
            } else {
                return this.domain_inversion.simplify(['OR'].concat(result));
            }
        }
    });

    Sao.common.guess_mimetype = function(filename) {
        if (/.*odt$/.test(filename)) {
            return 'application/vnd.oasis.opendocument.text';
        } else if (/.*ods$/.test(filename)) {
            return 'application/vnd.oasis.opendocument.spreadsheet';
        } else if (/.*pdf$/.test(filename)) {
            return 'application/pdf';
        } else if (/.*docx$/.test(filename)) {
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (/.*doc/.test(filename)) {
            return 'application/msword';
        } else if (/.*xlsx$/.test(filename)) {
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (/.*xls/.test(filename)) {
            return 'application/vnd.ms-excel';
        } else {
            return 'application/octet-binary';
        }
    };

    Sao.common.LOCAL_ICONS = [
        'tryton-add',
        'tryton-archive',
        'tryton-attach',
        'tryton-back',
        'tryton-bookmark-border',
        'tryton-bookmark',
        'tryton-bookmarks',
        'tryton-cancel',
        'tryton-clear',
        'tryton-close',
        'tryton-copy',
        'tryton-create',
        'tryton-date',
        'tryton-delete',
        'tryton-email',
        'tryton-error',
        'tryton-exit',
        'tryton-export',
        'tryton-filter',
        'tryton-format-align-center',
        'tryton-format-align-justify',
        'tryton-format-align-left',
        'tryton-format-align-right',
        'tryton-format-bold',
        'tryton-format-color-text',
        'tryton-format-italic',
        'tryton-format-underline',
        'tryton-forward',
        'tryton-history',
        'tryton-import',
        'tryton-info',
        'tryton-launch',
        'tryton-link',
        'tryton-log',
        'tryton-menu',
        'tryton-note',
        'tryton-ok',
        'tryton-open',
        'tryton-print',
        'tryton-public',
        'tryton-refresh',
        'tryton-remove',
        'tryton-save',
        'tryton-search',
        'tryton-star-border',
        'tryton-star',
        'tryton-switch',
        'tryton-translate',
        'tryton-unarchive',
        'tryton-undo',
        'tryton-warning',
    ];

    Sao.common.IconFactory = Sao.class_(Object, {
        batchnum: 10,
        name2id: {},
        loaded_icons: {},
        tryton_icons: [],
        register_prm: jQuery.when(),
        load_icons: function(refresh) {
            refresh = refresh || false;
            if (!refresh) {
                for (var icon_name in this.load_icons) {
                    if (!this.load_icons.hasOwnProperty(icon_name)) {
                        continue;
                    }
                    window.URL.revokeObjectURL(this.load_icons[icon_name]);
                }
            }

            var icon_model = new Sao.Model('ir.ui.icon');
            return icon_model.execute('list_icons', [], {})
            .then(function(icons) {
                if (!refresh) {
                    this.name2id = {};
                    this.loaded_icons = {};
                }
                this.tryton_icons = [];

                var icon_id, icon_name;
                for (var i=0, len=icons.length; i < len; i++) {
                    icon_id = icons[i][0];
                    icon_name = icons[i][1];
                    if (refresh && (icon_name in this.loaded_icons)) {
                        continue;
                    }
                    this.tryton_icons.push([icon_id, icon_name]);
                    this.name2id[icon_name] = icon_id;
                }
            }.bind(this));
        },
        register_icon: function(icon_name) {
            if (!icon_name) {
                return jQuery.when();
            } else if ((icon_name in this.loaded_icons) ||
                    ~Sao.common.LOCAL_ICONS.indexOf(icon_name)) {
                return jQuery.when();
            }
            if (this.register_prm.state() == 'pending') {
                return this.register_prm.then(function() {
                    return this.register_icon(icon_name);
                }.bind(this));
            }
            var loaded_prm;
            if (!(icon_name in this.name2id)) {
                loaded_prm = this.load_icons(true);
            } else {
                loaded_prm = jQuery.when();
            }

            var icon_model = new Sao.Model('ir.ui.icon');
            this.register_prm = loaded_prm.then(function () {
                var find_array = function(array) {
                    var idx, l;
                    for (idx=0, l=this.tryton_icons.length; idx < l; idx++) {
                        var icon = this.tryton_icons[idx];
                        if (Sao.common.compare(icon, array)) {
                            break;
                        }
                    }
                    return idx;
                }.bind(this);
                var idx = find_array([this.name2id[icon_name], icon_name]);
                var from = Math.round(idx - this.batchnum / 2);
                from = (from < 0) ? 0 : from;
                var to = Math.round(idx + this.batchnum / 2);
                var ids = [];
                this.tryton_icons.slice(from, to).forEach(function(e) {
                    ids.push(e[0]);
                });

                var read_prm = icon_model.execute('read',
                    [ids, ['name', 'icon']], {});
                return read_prm.then(function(icons) {
                    icons.forEach(function(icon) {
                        var img_url = this._convert(icon.icon);
                        this.loaded_icons[icon.name] = img_url;
                        delete this.name2id[icon.name];
                        this.tryton_icons.splice(
                            find_array([icon.id, icon.name]), 1);
                    }.bind(this));
                }.bind(this));
            }.bind(this));
            return this.register_prm;
        },
        _convert: function(data) {
            var xml = jQuery.parseXML(data);
            jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors[0]);
            data = new XMLSerializer().serializeToString(xml);
            var blob = new Blob([data],
                {type: 'image/svg+xml'});
            return window.URL.createObjectURL(blob);
        },
        get_icon_url: function(icon_name) {
            if (!icon_name) {
                return;
            }
            return this.register_icon(icon_name).then(function() {
                if (icon_name in this.loaded_icons) {
                    return this.loaded_icons[icon_name];
                } else {
                    return jQuery.get('images/' + icon_name + '.svg', null, null, 'text')
                        .then(function(icon) {
                            var img_url = this._convert(icon);
                            this.loaded_icons[icon_name] = img_url;
                            return img_url;
                        }.bind(this));
                }
            }.bind(this));
        },
        get_icon_img: function(icon_name, attrs) {
            attrs = attrs || {};
            if (!attrs['class']) {
                attrs['class'] = 'icon';
            }
            var img = jQuery('<img/>', attrs);
            if (icon_name) {
                this.get_icon_url(icon_name).then(function(url) {
                    img.attr('src', url);
                });
            }
            return img;
        },
    });

    Sao.common.ICONFACTORY = new Sao.common.IconFactory();

    Sao.common.UniqueDialog = Sao.class_(Object, {
        init: function() {
            this.running = false;
        },
        build_dialog: function() {
            var dialog = new Sao.Dialog('', this.class_);
            return dialog;
        },
        run: function() {
            if (this.running) {
                return jQuery.when();
            }
            var args = Array.prototype.slice.call(arguments);
            var prm = jQuery.Deferred();
            args.push(prm);
            var dialog = this.build_dialog.apply(this, args);
            dialog.content.submit(function(evt) {
                dialog.footer.find('button.btn-primary').first().click();
                evt.preventDefault();
            }.bind(this));
            this.running = true;
            dialog.modal.modal('show');
            dialog.modal.on('shown.bs.modal', function() {
                dialog.modal.find('input,select')
                    .filter(':visible').first().focus();
            });
            return prm;
        },
        close: function(dialog) {
            dialog.modal.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
            dialog.modal.modal('hide');
            this.running = false;
        }
    });

    Sao.common.MessageDialog = Sao.class_(Sao.common.UniqueDialog, {
        class_: 'message-dialog',
        build_dialog: function(message, icon, prm) {
            var dialog = Sao.common.MessageDialog._super.build_dialog.call(
                this);
            dialog.header.remove();
            dialog.body.append(jQuery('<div/>', {
                'class': 'alert alert-info',
                role: 'alert'
            }).append(Sao.common.ICONFACTORY.get_icon_img(icon, {
                'aria-hidden': true,
            })).append(jQuery('<span/>', {
                'class': 'sr-only'
            }).append(Sao.i18n.gettext('Message: '))
            ).append(jQuery('<span/>')
                .append(message)
                .css('white-space', 'pre-wrap')));
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('OK')).click(function() {
                this.close(dialog);
                prm.resolve('ok');
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        },
        run: function(message, icon) {
            return Sao.common.MessageDialog._super.run.call(
                    this, message, icon || 'tryton-info');
        }
    });
    Sao.common.message = new Sao.common.MessageDialog();

    Sao.common.WarningDialog = Sao.class_(Sao.common.UniqueDialog, {
        class_: 'warning-dialog',
        build_dialog: function(message, title, prm) {
            var dialog = Sao.common.WarningDialog._super.build_dialog.call(
                this);
            var content = jQuery('<div/>', {
                'class': 'alert alert-warning',
                role: 'alert'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-warning', {
                'aria-hidden': true,
            })).append(jQuery('<span/>', {
                'class': 'sr-only'
            }).append(Sao.i18n.gettext('Warning: '))
            ).append(jQuery('<h4/>')
                .append(title)
                .css('white-space', 'pre-wrap'));
            if (message) {
                content.append(jQuery('<span/>')
                    .append(message)
                    .css('white-space', 'pre-wrap'));
            }
            dialog.body.append(content);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('OK')).click(function() {
                this.close(dialog);
                prm.resolve('ok');
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.warning = new Sao.common.WarningDialog();

    Sao.common.UserWarningDialog = Sao.class_(Sao.common.WarningDialog, {
        class_: 'user-warning-dialog',
        build_dialog: function(message, title, prm) {
            var dialog = Sao.common.UserWarningDialog._super.build_dialog.call(
                this, message, title, prm);
            var always = jQuery('<input/>', {
                'type': 'checkbox'
            });
            dialog.body.append(jQuery('<div/>', {
                'class': 'checkbox',
            }).append(jQuery('<label/>')
                .append(always)
                .append(Sao.i18n.gettext('Always ignore this warning.')))
            );
            dialog.body.append(jQuery('<p/>')
                    .text(Sao.i18n.gettext('Do you want to proceed?')));
            dialog.footer.children().remove();
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('No')).click(function() {
                this.close(dialog);
                prm.reject();
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('Yes')).click(function() {
                this.close(dialog);
                if (always.prop('checked')) {
                    prm.resolve('always');
                }
                prm.resolve('ok');
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.userwarning = new Sao.common.UserWarningDialog();

    Sao.common.ConfirmationDialog = Sao.class_(Sao.common.UniqueDialog, {
        class_: 'confirmation-dialog',
        build_dialog: function(message) {
            var dialog = Sao.common.ConfirmationDialog._super.build_dialog.call(
                this);
            dialog.header.remove();
            dialog.body.append(jQuery('<div/>', {
                'class': 'alert alert-info',
                role: 'alert'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-info', {
                'aria-hidden': true,
            })).append(jQuery('<span/>', {
                'class': 'sr-only'
            }).append(Sao.i18n.gettext('Confirmation: '))
            ).append(jQuery('<span/>')
                .append(message)
                .css('white-space', 'pre-wrap')));
            return dialog;
        }
    });

    Sao.common.SurDialog = Sao.class_(Sao.common.ConfirmationDialog, {
        build_dialog: function(message, prm) {
            var dialog = Sao.common.SurDialog._super.build_dialog.call(
                this, message);
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.close(dialog);
                prm.reject();
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('OK')).click(function() {
                this.close(dialog);
                prm.resolve();
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.sur = new Sao.common.SurDialog();

    Sao.common.Sur3BDialog = Sao.class_(Sao.common.ConfirmationDialog, {
        build_dialog: function(message, prm) {
            var dialog = Sao.common.SurDialog._super.build_dialog.call(
                this, message);
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.close(dialog);
                prm.resolve('cancel');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button'
            }).append(Sao.i18n.gettext('No')).click(function() {
                this.close(dialog);
                prm.resolve('ko');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('Yes')).click(function() {
                this.close(dialog);
                prm.resolve('ok');
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.sur_3b = new Sao.common.Sur3BDialog();

    Sao.common.AskDialog = Sao.class_(Sao.common.UniqueDialog, {
        class_: 'ask-dialog',
        run: function() {
            var args = Array.prototype.slice.call(arguments);
            if (args.length == 1) {
                args.push(true);
            }
            return Sao.common.AskDialog._super.run.apply(this, args);
        },
        build_dialog: function(question, visibility, prm) {
            var dialog = Sao.common.AskDialog._super.build_dialog.call(this);
            dialog.header.remove();
            var entry = jQuery('<input/>', {
                'class': 'form-control',
                'type': visibility ? 'input' : 'password',
                'id': 'ask-dialog-entry'
            });
            dialog.body.append(jQuery('<div/>', {
                'class': 'form-group'
            }).append(jQuery('<label/>', {
                'for': 'ask-dialog-entry'
            }).append(question)).append(entry));
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.close(dialog);
                prm.reject();
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('OK')).click(function() {
                this.close(dialog);
                prm.resolve(entry.val());
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.ask = new Sao.common.AskDialog();

    Sao.common.ConcurrencyDialog = Sao.class_(Sao.common.UniqueDialog, {
        class_: 'ask-dialog',
        build_dialog: function(model, record_id, context, prm) {
            var dialog = Sao.common.ConcurrencyDialog._super.build_dialog.call(
                this);
            dialog.modal.find('.modal-dialog'
                ).removeClass('modal-sm').addClass('modal-lg');
            dialog.add_title(Sao.i18n.gettext('Concurrency Exception'));
            dialog.body.append(jQuery('<div/>', {
                'class': 'alert alert-warning',
                role: 'alert'
            }).append(jQuery('<p/>')
                .append(Sao.common.ICONFACTORY.get_icon_img('tryton-info', {
                    'aria-hidden': true,
                })).append(jQuery('<span/>', {
                    'class': 'sr-only'
                }).append(Sao.i18n.gettext('Write Concurrency Warning: '))
                ).append(Sao.i18n.gettext('This record has been modified ' +
                'while you were editing it.')))
                .append(jQuery('<p/>').text(Sao.i18n.gettext('Choose:')))
                .append(jQuery('<ul/>')
                    .append(jQuery('<li/>')
                        .text(Sao.i18n.gettext('"Cancel" to cancel saving;')))
                    .append(jQuery('<li/>')
                        .text(Sao.i18n.gettext(
                                '"Compare" to see the modified version;')))
                    .append(jQuery('<li/>')
                        .text(Sao.i18n.gettext(
                                '"Write Anyway" to save your current version.'))))
                );
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.close(dialog);
                prm.reject();
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button'
            }).append(Sao.i18n.gettext('Compare')).click(function() {
                this.close(dialog);
                Sao.Tab.create({
                    'model': model,
                    'res_id': record_id,
                    'domain': [['id', '=', record_id]],
                    'context': context,
                    'mode': ['form', 'tree']
                });
                prm.reject();
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button'
            }).append(Sao.i18n.gettext('Write Anyway')).click(function() {
                this.close(dialog);
                prm.resolve();
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.concurrency = new Sao.common.ConcurrencyDialog();

    Sao.common.ErrorDialog = Sao.class_(Sao.common.UniqueDialog, {
        class_: 'error-dialog',
        build_dialog: function(title, details, prm) {
            var dialog = Sao.common.ConcurrencyDialog._super.build_dialog.call(
                this);
            dialog.modal.find('.modal-dialog'
                ).removeClass('modal-sm').addClass('modal-lg');
            dialog.add_title(Sao.i18n.gettext('Application Error'));
            dialog.body.append(jQuery('<div/>', {
                'class': 'alert alert-warning',
                role: 'alert'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-error', {
                'aria-hidden': true,
            })).append(jQuery('<span/>', {
                'class': 'sr-only'
            }).append(Sao.i18n.gettext('Warning: '))
            ).append(jQuery('<p/>')
                .append(jQuery('<pre/>')
                    .text(details)))
                .append(jQuery('<p/>')
                    .append(jQuery('<a/>', {
                        'class': 'btn btn-link',
                        href: Sao.config.bug_url,
                        target: '_blank'
                    }).text(Sao.i18n.gettext('Report Bug')))));
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'button'
            }).append(Sao.i18n.gettext('Close')).click(function() {
                this.close(dialog);
                prm.resolve();
            }.bind(this)).appendTo(dialog.footer);
            return dialog;
        }
    });
    Sao.common.error = new Sao.common.ErrorDialog();

    Sao.common.Processing = Sao.class_(Object, {
        queries: 0,
        timeout: 500,
        init: function() {
            this.el = jQuery('<div/>', {
                'id': 'processing',
                'class': 'text-center'
            });
            this.el.append(jQuery('<span/>', {
                'class': 'label label-info',
                'text': Sao.i18n.gettext('Processing...')
            }));
            this.el.hide();
            jQuery(function() {
                this.el.appendTo('body');
            }.bind(this));
        },
        show: function() {
            return window.setTimeout(function() {
                this.queries += 1;
                this.el.show();
            }.bind(this), this.timeout);
        },
        hide: function(timeoutID) {
            window.clearTimeout(timeoutID);
            if (this.queries > 0) {
                this.queries -= 1;
            }
            if (this.queries <= 0) {
                this.queries = 0;
                this.el.hide();
            }
        }
    });
    Sao.common.processing = new Sao.common.Processing();

    Sao.common.InputCompletion = Sao.class_(Object, {
        init: function(el, source, match_selected, format) {
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

            this.input.on('input', function() {
                window.setTimeout(this._input.bind(this), 300,
                        this.input.val());
            }.bind(this));
            this.input.keydown(function(evt) {
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
            this.menu.keydown(function(evt) {
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
            this.dropdown.on('hide.bs.dropdown', function() {
                this.input.focus();
                this.input.closest('.treeview').css('overflow', '');
                this.input.closest('.modal-body').css('overflow', '');
                this.input.closest('.navbar-collapse.in').css('overflow-y', '');
            }.bind(this));
            this.dropdown.on('show.bs.dropdown', function() {
                this.input.closest('.treeview').css('overflow', 'visible');
                this.input.closest('.modal-body').css('overflow', 'visible');
                this.input.closest('.navbar-collapse.in').css('overflow-y', 'visible');
            }.bind(this));
        },
        set_actions: function(actions, action_activated) {
            if (action_activated !== undefined) {
                this.action_activated = action_activated;
            }
            this.menu.find('li.action').remove();
            if (jQuery.isEmptyObject(actions)) {
                this.separator.hide();
                return;
            }
            this.separator.show();
            actions.forEach(function(action) {
                var action_id = action[0];
                var content = action[1];
                jQuery('<li/>', {
                    'class': 'action action-' + action_id
                }).append(jQuery('<a/>', {
                    'href': '#'
                }).append(this._format_action(content)))
                .click(function(evt) {
                    evt.preventDefault();
                    if (this.action_activated) {
                        this.action_activated(action_id);
                    }
                    this.input.val('');
                }.bind(this))
                .appendTo(this.menu);
            }, this);
        },
        _format: function(content) {
            if (this.format) {
                return this.format(content);
            }
            return content;
        },
        _format_action: function(content) {
            if (this.format_action) {
                return this.format_action(content);
            }
            return content;
        },
        _input: function(text) {
            if (text != this.input.val()) {
                return;
            }
            var prm;
            if (this.source instanceof Array) {
                prm = jQuery.when(source.filter(function(value) {
                    return value.toLowerCase().startsWith(text.toLowerCase());
                }));
            } else {
                prm = this.source(text);
            }
            prm.then(function(values) {
                if (text != this.input.val()) {
                    return;
                }
                this._set_selection(values);
            }.bind(this));
        },
        _set_selection: function(values) {
            if (values === undefined) {
                values = [];
            }
            this.menu.find('li.completion').remove();
            values.reverse().forEach(function(value) {
                jQuery('<li/>', {
                    'class': 'completion'
                }).append(jQuery('<a/>', {
                    'href': '#'
                }).append(this._format(value)))
                .click(function(evt) {
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
        }
    });

    Sao.common.get_completion = function(el, source,
            match_selected, action_activated) {
        var format = function(content) {
            return content.rec_name;
        };
        var completion = new Sao.common.InputCompletion(
                el, source, match_selected, format);
        completion.set_actions([
                ['search', Sao.i18n.gettext('Search...')],
                ['create', Sao.i18n.gettext('Create...')]],
                action_activated);
    };

    Sao.common.update_completion = function(
            entry, record, field, model, domain) {
        var search_text = entry.val();
        if (!search_text || !model) {
            return jQuery.when();
        }
        if (domain === undefined) {
            domain = field.get_domain(record);
        }
        var context = field.get_search_context(record);
        domain = [['rec_name', 'ilike', '%' + search_text + '%'], domain];

        var order = field.get_search_order(record);
        var sao_model = new Sao.Model(model);
        return sao_model.execute('search_read',
                [domain, 0, Sao.config.limit, order, ['rec_name']], context);
    };

    Sao.common.Paned = Sao.class_(Object, {
        init: function(orientation) {
            var row;
            this._orientation = orientation;
            this.el = jQuery('<div/>');
            if (orientation == 'horizontal') {
                row = jQuery('<div/>', {
                    'class': 'row'
                }).appendTo(this.el);
                this.child1 = jQuery('<div/>', {
                    'class': 'col-md-6'
                }).appendTo(row);
                this.child2 = jQuery('<div/>', {
                    'class': 'col-md-6'
                }).appendTo(row);
            } else if (orientation == 'vertical') {
                this.child1 = jQuery('<div/>', {
                    'class': 'row'
                }).appendTo(this.el);
                this.child2 = jQuery('<div/>', {
                    'class': 'row'
                }).appendTo(this.el);
            }
        },
        get_child1: function() {
            return this.child1;
        },
        get_child2: function() {
            return this.child2;
        }
    });

    Sao.common.get_focus_chain = function(element) {
        var elements = element.find('input', 'textarea');
        elements.sort(function(a, b) {
            if (('tabindex' in a.attributes) && ('tabindex' in b.attributes)) {
                var a_tabindex = parseInt(a.attributes.tabindex.value);
                var b_tabindex = parseInt(b.attributes.tabindex.value);
                return a_tabindex - b_tabindex;
            } else if ('tabindex' in a.attributes) {
                return -1;
            } else if ('tabindex' in b.attributes) {
                return 1;
            } else {
                return 0;
            }
        });
        return elements;
    };

    Sao.common.find_focusable_child = function(element) {
        var i, len, children, focusable;

        if (!element.is(':visible')) {
            return null;
        }
        if (~['input', 'select', 'textarea'].indexOf(
                    element[0].tagName.toLowerCase())) {
            return element;
        }

        children = Sao.common.get_focus_chain(element);
        for (i = 0, len = children.length; i < len; i++) {
            focusable = Sao.common.find_focusable_child(jQuery(children[i]));
            if (focusable) {
                return focusable;
            }
        }
    };

    Sao.common.find_first_focus_widget = function(ancestor, widgets) {
        var i, j;
        var children, commons, is_common;

        if (widgets.length == 1) {
            return jQuery(widgets[0]);
        }
        children = Sao.common.get_focus_chain(ancestor);
        for (i = 0; i < children.length; i++) {
            commons = [];
            for (j = 0; j < widgets.length; j++) {
                is_common = jQuery(widgets[j]).closest(children[i]).length > 0;
                if (is_common) {
                    commons.push(widgets[j]);
                }
            }
            if (commons.length > 0) {
                return Sao.common.find_first_focus_widget(jQuery(children[i]),
                        commons);
            }
        }
    };

    Sao.common.apply_label_attributes = function(label, readonly, required) {
        if (!readonly) {
            label.addClass('editable');
            if (required) {
                label.addClass('required');
            } else {
                label.removeClass('required');
            }
        } else {
            label.removeClass('editable required');
        }
    };

    Sao.common.download_file = function(data, name, options) {
        if (options === undefined) {
            var type = Sao.common.guess_mimetype(
                name ? name.split('.').pop() : undefined);
            options = {type: type};
        }
        var blob = new Blob([data], options);

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, name);
            return;
        }

        var blob_url = window.URL.createObjectURL(blob);

        var dialog = new Sao.Dialog(Sao.i18n.gettext('Download'));
        var close = function() {
            dialog.modal.modal('hide');
        };
        var a = jQuery('<a/>', {
                'href': blob_url,
                'download': name,
                'text': name,
                'target': '_blank'
                }).appendTo(dialog.body)
                .click(close);
        var button = jQuery('<button/>', {
            'class': 'btn btn-default',
            'type': 'button'
        }).append(Sao.i18n.gettext('Close')).click(close)
            .appendTo(dialog.footer);
        dialog.modal.on('shown.bs.modal', function() {
            // Force the click trigger
            a[0].click();
        });
        dialog.modal.modal('show');

        dialog.modal.on('hidden.bs.modal', function() {
            jQuery(this).remove();
            window.URL.revokeObjectURL(this.blob_url);
        });

    };

    Sao.common.get_input_data = function(input, callback, char_) {
        for (var i = 0; i < input[0].files.length; i++) {
            Sao.common.get_file_data(input[0].files[i], callback, char_);
        }
    };

    Sao.common.get_file_data = function(file, callback, char_) {
        var reader = new FileReader();
        reader.onload = function() {
            var value = new Uint8Array(reader.result);
            if (char_) {
                value = String.fromCharCode.apply(null, value);
            }
            callback(value, file.name);
        };
        reader.readAsArrayBuffer(file);
    };

    Sao.common.ellipsize = function(string, length) {
        if (string.length <= length) {
            return string;
        }
        var ellipsis = Sao.i18n.gettext('...');
        return string.slice(0, length - ellipsis.length) + ellipsis;
    };

    Sao.common.debounce = function(func, wait) {
        return function() {
            var args = [].slice(arguments);
            clearTimeout(func._debounceTimeout);
            func._debounceTimeout = setTimeout(function() {
                func.apply(this, args);
            }.bind(this), wait);
        }.bind(this);
    };

    Sao.common.uuid4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
            function(c) {
                var r = Math.random() * 16 | 0;
                var v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    };

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Window = {};

    Sao.Window.InfoBar = Sao.class_(Object, {
        init: function() {
            this.text = jQuery('<span/>');
            this.text.css('white-space', 'pre-wrap');
            this.el= jQuery('<div/>', {
                'class': 'alert infobar',
                'role': 'alert'
            }).append(jQuery('<button/>', {
                'type': 'button',
                'class': 'close',
                'aria-label': Sao.i18n.gettext('Close')
            }).append(jQuery('<span/>', {
                'aria-hidden': true
            }).append('&times;')).click(function() {
                this.el.hide();
            }.bind(this))).append(this.text);
            this.el.hide();
        },
        message: function(message, type) {
            if (message) {
                this.el.removeClass(
                        'alert-success alert-info alert-warning alert-danger');
                this.el.addClass('alert-' + (type || 'info'));
                this.text.text(message);
                this.el.show();
            } else {
                this.el.hide();
            }
        }
    });

    Sao.Window.Form = Sao.class_(Object, {
        init: function(screen, callback, kwargs) {
            kwargs = kwargs || {};
            this.screen = screen;
            this.callback = callback;
            this.many = kwargs.many || 0;
            this.domain = kwargs.domain || null;
            this.context = kwargs.context || null;
            this.save_current = kwargs.save_current;
            var title_prm = jQuery.when(kwargs.title || '');
            title_prm.then(function(title) {
                this.title = title;
            }.bind(this));

            this.prev_view = screen.current_view;
            this.screen.screen_container.alternate_view = true;
            this.info_bar = new Sao.Window.InfoBar();
            var view_type = kwargs.view_type || 'form';

            this.switch_prm = this.screen.switch_view(view_type)
                .done(function() {
                    if (kwargs.new_ &&
                        (this.screen.current_view.view_type == view_type)) {
                        this.screen.new_(undefined, kwargs.rec_name);
                    }
                }.bind(this));
            var dialog = new Sao.Dialog('', 'window-form', 'lg', false);
            this.el = dialog.modal;
            this.el.on('keydown', function(e) {
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
                }).append(button_text).click(function() {
                    this.response('RESPONSE_CANCEL');
                }.bind(this)));
            }

            if (kwargs.new_ && this.many) {
                dialog.footer.append(jQuery('<button/>', {
                    'class': 'btn btn-default',
                    'type': 'button'
                }).append(Sao.i18n.gettext('New')).click(function() {
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
            dialog.content.submit(function(e) {
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
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-switch')
                ).appendTo(buttons);
                this.but_switch.click(this.switch_.bind(this));

                this.but_previous = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Previous')
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-back')
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
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-forward')
                ).appendTo(buttons);
                this.but_next.click(this.next.bind(this));

                if (this.domain) {
                    this.wid_text.show();

                    this.but_add = jQuery('<button/>', {
                        'class': 'btn btn-default btn-sm',
                        'type': 'button',
                        'aria-label': Sao.i18n.gettext('Add')
                    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add')
                    ).appendTo(buttons);
                    this.but_add.click(this.add.bind(this));
                    this.but_add.prop('disabled', !access.read || readonly);

                    this.but_remove = jQuery('<button/>', {
                        'class': 'btn btn-default btn-sm',
                        'type': 'button',
                        'aria-label': Sao.i18n.gettext('Remove')
                    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove')
                    ).appendTo(buttons);
                    this.but_remove.click(this.remove.bind(this));
                    this.but_remove.prop('disabled', !access.read || readonly);
                }

                this.but_new = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('New')
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-create')
                ).appendTo(buttons);
                this.but_new.click(this.new_.bind(this));
                this.but_new.prop('disabled', !access.create || readonly);

                this.but_del = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Delete')
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-delete')
                ).appendTo(buttons);
                this.but_del.click(this.delete_.bind(this));
                this.but_del.prop('disabled', !access['delete'] || readonly);

                this.but_undel = jQuery('<button/>', {
                    'class': 'btn btn-default btn-sm',
                    'type': 'button',
                    'aria-label': Sao.i18n.gettext('Undelete')
                }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-undo')
                ).appendTo(buttons);
                this.but_undel.click(this.undelete.bind(this));
                this.but_undel.prop('disabled', !access['delete'] || readonly);

                this.screen.message_callback = this.record_label.bind(this);
            }

            var content = jQuery('<div/>').appendTo(dialog.body);

            dialog.body.append(this.info_bar.el);

            this.switch_prm.done(function() {
                if (this.screen.current_view.view_type != view_type) {
                    this.destroy();
                } else {
                    title_prm.done(dialog.add_title.bind(dialog));
                    content.append(this.screen.screen_container.alternate_viewport);
                    this.el.modal('show');
                }
            }.bind(this));
            this.el.on('shown.bs.modal', function(event) {
                this.screen.display().done(function() {
                    this.screen.set_cursor();
                }.bind(this));
            }.bind(this));
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
        },
        record_label: function(data) {
            var name = '_';
            var access = Sao.common.MODELACCESS.get(this.screen.model_name);
            var readonly = this.screen.group.readonly;
            if (data[0] >= 1) {
                name = data[0];
                if (this.domain) {
                    this.but_remove.prop('disabled', false);
                }
                this.but_next.prop('disabled', data[0] >= data[1]);
                this.but_previous.prop('disabled', data[0] <= 1);
                if (access.delete && !readonly) {
                    this.but_del.prop('disabled', false);
                    this.but_undel.prop('disabled', false);
                }
            } else {
                this.but_del.prop('disabled', true);
                this.but_undel.prop('disabled', true);
                this.but_next.prop('disabled', true);
                this.but_previous.prop('disabled', true);
                if (this.domain) {
                    this.but_remove.prop('disabled', true);
                }
            }
            var message = name + '/' + data[1];
            this.label.text(message).attr('title', message);
        },
        add: function() {
            var domain = jQuery.extend([], this.domain);
            var model_name = this.screen.model_name;
            var value = this.wid_text.val();

            var callback = function(result) {
                var prm = jQuery.when();
                if (!jQuery.isEmptyObject(result)) {
                    var ids = [];
                    for (var i = 0, len = result.length; i < len; i++) {
                        ids.push(result[i][0]);
                    }
                    this.screen.group.load(ids, true);
                    prm = this.screen.display();
                }
                prm.done(function() {
                    this.screen.set_cursor();
                }.bind(this));
                this.entry.val('');
            }.bind(this);
            var parser = new Sao.common.DomainParser();
            var win = new Sao.Window.Search(model_name, callback, {
                sel_multi: true,
                context: this.context,
                domain: domain,
                search_filter: parser.quote(value)
            });
        },
        remove: function() {
            this.screen.remove(false, true, false);
        },
        new_: function() {
            this.screen.new_();
            this._initial_value = null;
        },
        delete_: function() {
            this.screen.remove(false, false, false);
        },
        undelete: function() {
            this.screen.unremove();
        },
        previous: function() {
            this.screen.display_previous();
        },
        next: function() {
            this.screen.display_next();
        },
        switch_: function() {
            this.screen.switch_view();
        },
        response: function(response_id) {
            var result;
            this.screen.current_view.set_value();
            var readonly = this.screen.group.readonly;
            if (~['RESPONSE_OK', 'RESPONSE_ACCEPT'].indexOf(response_id) &&
                    !readonly &&
                    this.screen.current_record) {
                this.screen.current_record.validate().then(function(validate) {
                    if (validate && this.screen.attributes.pre_validate) {
                        return this.screen.current_record.pre_validate();
                    }
                    return validate;
                }.bind(this)).then(function(validate) {
                    var closing_prm = jQuery.Deferred();
                    if (validate && this.save_current) {
                        this.screen.save_current().then(closing_prm.resolve,
                            closing_prm.reject);
                    } else if (validate &&
                            this.screen.current_view.view_type == 'form') {
                        var view = this.screen.current_view;
                        var validate_prms = [];
                        for (var name in view.widgets) {
                            var widget = view.widgets[name];
                            if (widget.screen &&
                                widget.screen.attributes.pre_validate) {
                                var record = widget.screen.current_record;
                                if (record) {
                                    validate_prms.push(record.pre_validate());
                                }
                            }
                        }
                        jQuery.when.apply(jQuery, validate_prms).then(
                            closing_prm.resolve, closing_prm.reject);
                    } else if (!validate) {
                        this.info_bar.message(
                            this.screen.invalid_message(), 'danger');
                        closing_prm.reject();
                    } else {
                        this.info_bar.message();
                        closing_prm.resolve();
                    }

                    closing_prm.fail(function() {
                        this.screen.display().done(function() {
                            this.screen.set_cursor();
                        }.bind(this));
                    }.bind(this));

                    // TODO Add support for many
                    closing_prm.done(function() {
                        if (response_id == 'RESPONSE_ACCEPT') {
                            this.screen.new_();
                            this.screen.current_view.display().done(function() {
                                this.screen.set_cursor();
                            }.bind(this));
                            this.many -= 1;
                            if (this.many === 0) {
                                this.but_new.prop('disabled', true);
                            }
                        } else {
                            result = true;
                            this.callback(result);
                            this.destroy();
                        }
                    }.bind(this));
                }.bind(this));
                return;
            }

            var cancel_prm = null;
            if (response_id == 'RESPONSE_CANCEL' &&
                    !readonly &&
                    this.screen.current_record) {
                result = false;
                if ((this.screen.current_record.id < 0) || this.save_current) {
                    cancel_prm = this.screen.cancel_current(
                        this._initial_value);
                } else if (this.screen.current_record.has_changed()) {
                    this.screen.current_record.cancel();
                    cancel_prm = this.screen.current_record.reload();
                }
            } else {
                result = response_id != 'RESPONSE_CANCEL';
            }
            (cancel_prm || jQuery.when()).done(function() {
                this.callback(result);
                this.destroy();
            }.bind(this));
        },
        destroy: function() {
            this.screen.screen_container.alternate_view = false;
            this.screen.screen_container.alternate_viewport.children()
                .detach();
            if (this.prev_view) {
                // Empty when opening from Many2One
                this.screen.switch_view(this.prev_view.view_type);
            }
            this.el.modal('hide');
        }
    });

    Sao.Window.Attachment = Sao.class_(Sao.Window.Form, {
        init: function(record, callback) {
            this.resource = record.model.name + ',' + record.id;
            this.attachment_callback = callback;
            var context = jQuery.extend({}, record.get_context());
            var screen = new Sao.Screen('ir.attachment', {
                domain: [['resource', '=', this.resource]],
                mode: ['tree', 'form'],
                context: context,
            });
            var title = record.rec_name().then(function(rec_name) {
                return Sao.i18n.gettext('Attachments (%1)', rec_name);
            });
            Sao.Window.Attachment._super.init.call(this, screen, this.callback,
                {view_type: 'tree', title: title});
            this.switch_prm = this.switch_prm.then(function() {
                return screen.search_filter();
            });
        },
        callback: function(result) {
            var prm = jQuery.when();
            if (result) {
                prm = this.screen.save_current();
            }
            if (this.attachment_callback) {
                prm.always(this.attachment_callback.bind(this));
            }
        },
        add_data: function(data, filename) {
            var screen = this.screen;
            this.switch_prm.then(function() {
                screen.new_().then(function(record) {
                    var data_field = record.model.fields.data;
                    record.field_set_client(
                        data_field.description.filename, filename);
                    record.field_set_client('data', data);
                    screen.display();
                });
            });
        },
        add_uri: function(uri) {
            var screen = this.screen;
            this.switch_prm.then(function() {
                screen.current_record = null;
                screen.switch_view('form').then(function() {
                    screen.new_().then(function(record) {
                        record.field_set_client('link', uri);
                        record.field_set_client('type', 'link');
                        screen.display();
                    });
                });
            });
        },
        add_text: function(text) {
            var screen = this.screen;
            this.switch_prm.then(function() {
                screen.current_record = null;
                screen.switch_view('form').then(function() {
                    screen.new_().then(function(record) {
                        record.field_set_client('description', text);
                        screen.display();
                    });
                });
            });
        },
    });
    Sao.Window.Attachment.get_attachments = function(record) {
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
        var partial = function(callback, attachment, context, session) {
            return function() {
                return callback(attachment, context, session);
            };
        };
        return prm.then(function(attachments) {
            return attachments.map(function(attachment) {
                var name = attachment.rec_name;
                if (attachment.type == 'link') {
                    return [name, attachment.link];
                } else {
                    var callback = Sao.Window.Attachment[
                        'open_' + attachment.type];
                    return [name, partial(
                        callback, attachment, context, record.model.session)];
                }
            });
        });
    };
    Sao.Window.Attachment.open_data = function(attachment, context, session) {
        Sao.rpc({
            'method': 'model.ir.attachment.read',
            'params': [
                [attachment.id], ['data'], context],
        }, session).then(function(values) {
            Sao.common.download_file(values[0].data, attachment.name);
        });
    };

    Sao.Window.Note = Sao.class_(Sao.Window.Form, {
        init: function(record, callback) {
            this.resource = record.model.name + ',' + record.id;
            this.note_callback = callback;
            var context = jQuery.extend({}, record.get_context());
            var screen = new Sao.Screen('ir.note', {
                domain: [['resource', '=', this.resource]],
                mode: ['tree', 'form'],
                context: context,
            });
            var title = record.rec_name().then(function(rec_name) {
                return Sao.i18n.gettext('Notes (%1)', rec_name);
            });
            Sao.Window.Note._super.init.call(this, screen, this.callback,
                {view_type: 'tree', title: title});
            this.switch_prm = this.switch_prm.then(function() {
                return screen.search_filter();
            });
        },
        callback: function(result) {
            var prm = jQuery.when();
            if (result) {
                var unread = this.screen.group.model.fields.unread;
                this.screen.group.forEach(function(record) {
                    if (record.get_loaded() || record.id < 0) {
                        if (!record._changed.unread) {
                            unread.set_client(record, false);
                        }
                    }
                }.bind(this));
                prm = this.screen.save_current();
            }
            if (this.note_callback) {
                prm.always(this.note_callback.bind(this));
            }
        }
    });

    Sao.Window.Search = Sao.class_(Object, {
        init: function(model, callback, kwargs) {
            kwargs = kwargs || {};
            var views_preload = kwargs.views_preload || {};
            this.model_name = model;
            this.domain = kwargs.domain || [];
            this.context = kwargs.context || {};
            this.order = kwargs.order || null;
            this.view_ids = kwargs.view_ids;
            this.views_preload = views_preload;
            this.sel_multi = kwargs.sel_multi;
            this.callback = callback;
            this.title = kwargs.title || '';
            var dialog = new Sao.Dialog(Sao.i18n.gettext(
                'Search %1', this.title), '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-default',
                'type': 'button'
            }).append(Sao.i18n.gettext('Find')).click(function() {
                this.response('RESPONSE_APPLY');
            }.bind(this)).appendTo(dialog.footer);
            if (kwargs.new_ && Sao.common.MODELACCESS.get(model).create) {
                jQuery('<button/>', {
                    'class': 'btn btn-default',
                    'type': 'button'
                }).append(Sao.i18n.gettext('New')).click(function() {
                    this.response('RESPONSE_ACCEPT');
                }.bind(this)).appendTo(dialog.footer);
            }
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
            dialog.content.submit(function(e) {
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this));

            this.screen = new Sao.Screen(model, {
                mode: ['tree'],
                context: this.context,
                domain: this.domain,
                order: this.order,
                view_ids: kwargs.view_ids,
                views_preload: views_preload,
                row_activate: this.activate.bind(this),
                readonly: true,
            });
            this.screen.load_next_view().done(function() {
                this.screen.switch_view().done(function() {
                    if (!this.sel_multi) {
                        this.screen.current_view.selection_mode = (
                            Sao.common.SELECTION_SINGLE);
                    } else {
                        this.screen.current_view.selection_mode = (
                            Sao.common.SELECTION_MULTIPLE);
                    }
                    dialog.body.append(this.screen.screen_container.el);
                    this.el.modal('show');
                    this.screen.display();
                    if (kwargs.search_filter !== undefined) {
                        this.screen.search_filter(kwargs.search_filter);
                    }
                }.bind(this));
            }.bind(this));
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
        },
        activate: function() {
            this.response('RESPONSE_OK');
        },
        response: function(response_id) {
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

                var callback = function(result) {
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
            this.el.modal('hide');
        }
    });

    Sao.Window.Preferences = Sao.class_(Object, {
        init: function(callback) {
            this.callback = callback;
            var dialog = new Sao.Dialog('Preferences', '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
            dialog.content.submit(function(e) {
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

            var set_view = function(view) {
                this.screen.add_view(view);
                this.screen.switch_view().done(function() {
                    this.screen.new_(false);
                    this.screen.model.execute('get_preferences', [false], {})
                    .then(set_preferences.bind(this), this.destroy);
                }.bind(this));
            };
            var set_preferences = function(preferences) {
                var prm;
                this.screen.current_record.cancel();
                prm = this.screen.current_record.set(preferences);
                this.screen.current_record.id =
                    this.screen.model.session.user_id;
                prm.then(function() {
                    this.screen.current_record.validate(null, true).then(
                        function() {
                            this.screen.display(true);
                        }.bind(this));
                }.bind(this));
                dialog.body.append(this.screen.screen_container.el);
                this.el.modal('show');
            };
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });

            this.screen.model.execute('get_preferences_fields_view', [], {})
                .then(set_view.bind(this), this.destroy);
        },
        response: function(response_id) {
            var end = function() {
                this.destroy();
                this.callback();
            }.bind(this);
            var prm = jQuery.when();
            if (response_id == 'RESPONSE_OK') {
                prm = this.screen.current_record.validate()
                    .then(function(validate) {
                        if (validate) {
                            var values = jQuery.extend({}, this.screen.get());
                            return this.screen.model.execute(
                                'set_preferences', [values], {});
                        }
                    }.bind(this));
            }
            prm.done(end);
        },
        destroy: function() {
            this.el.modal('hide');
        }
    });

    Sao.Window.Revision = Sao.class_(Object, {
        init: function(revisions, callback) {
            this.callback = callback;
            var dialog = new Sao.Dialog(
                    Sao.i18n.gettext('Revision'), '', 'lg');
            this.el = dialog.modal;

            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function() {
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(dialog.footer);
            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
            dialog.content.submit(function(e) {
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this));

            var group = jQuery('<div/>', {
                'class': 'form-group'
            }).appendTo(dialog.body);
            jQuery('<label/>', {
                'for': 'revision',
                'text': 'Revision'
            }).appendTo(group);
            this.select = jQuery('<select/>', {
                'class': 'form-control',
                id: 'revision',
                'placeholder': Sao.i18n.gettext('Revision')
            }).appendTo(group);
            var date_format = Sao.common.date_format();
            var time_format = '%H:%M:%S.%f';
            this.select.append(jQuery('<option/>', {
                value: null,
                text: ''
            }));
            revisions.forEach(function(revision) {
                var name = revision[2];
                revision = revision[0];
                this.select.append(jQuery('<option/>', {
                    value: revision.valueOf(),
                    text: Sao.common.format_datetime(
                        date_format, time_format, revision) + ' ' + name,
                }));
            }.bind(this));
            this.el.modal('show');
            this.el.on('hidden.bs.modal', function(event) {
                jQuery(this).remove();
            });
        },
        response: function(response_id) {
            var revision = null;
            if (response_id == 'RESPONSE_OK') {
                revision = this.select.val();
                if (revision) {
                    revision = Sao.DateTime(parseInt(revision, 10));
                }
            }
            this.el.modal('hide');
            this.callback(revision);
        }
    });

    Sao.Window.CSV = Sao.class_(Object, {
        init: function(title) {
            this.encodings = ["866", "ansi_x3.4-1968", "arabic", "ascii",
            "asmo-708", "big5", "big5-hkscs", "chinese", "cn-big5", "cp1250",
            "cp1251", "cp1252", "cp1253", "cp1254", "cp1255", "cp1256",
            "cp1257", "cp1258", "cp819", "cp866", "csbig5", "cseuckr",
            "cseucpkdfmtjapanese", "csgb2312", "csibm866", "csiso2022jp",
            "csiso2022kr", "csiso58gb231280", "csiso88596e", "csiso88596i",
            "csiso88598e", "csiso88598i", "csisolatin1", "csisolatin2",
            "csisolatin3", "csisolatin4", "csisolatin5", "csisolatin6",
            "csisolatin9", "csisolatinarabic", "csisolatincyrillic",
            "csisolatingreek", "csisolatinhebrew", "cskoi8r", "csksc56011987",
            "csmacintosh", "csshiftjis", "cyrillic", "dos-874", "ecma-114",
            "ecma-118", "elot_928", "euc-jp", "euc-kr", "gb18030", "gb2312",
            "gb_2312", "gb_2312-80", "gbk", "greek", "greek8", "hebrew",
            "hz-gb-2312", "ibm819", "ibm866", "iso-2022-cn", "iso-2022-cn-ext",
            "iso-2022-jp", "iso-2022-kr", "iso-8859-1", "iso-8859-10",
            "iso-8859-11", "iso-8859-13", "iso-8859-14", "iso-8859-15",
            "iso-8859-16", "iso-8859-2", "iso-8859-3", "iso-8859-4",
            "iso-8859-5", "iso-8859-6", "iso-8859-6-e", "iso-8859-6-i",
            "iso-8859-7", "iso-8859-8", "iso-8859-8-e", "iso-8859-8-i",
            "iso-8859-9", "iso-ir-100", "iso-ir-101", "iso-ir-109",
            "iso-ir-110", "iso-ir-126", "iso-ir-127", "iso-ir-138",
            "iso-ir-144", "iso-ir-148", "iso-ir-149", "iso-ir-157", "iso-ir-58",
            "iso8859-1", "iso8859-10", "iso8859-11", "iso8859-13", "iso8859-14",
            "iso8859-15", "iso8859-2", "iso8859-3", "iso8859-4", "iso8859-5",
            "iso8859-6", "iso8859-7", "iso8859-8", "iso8859-9", "iso88591",
            "iso885910", "iso885911", "iso885913", "iso885914", "iso885915",
            "iso88592", "iso88593", "iso88594", "iso88595", "iso88596",
            "iso88597", "iso88598", "iso88599", "iso_8859-1", "iso_8859-15",
            "iso_8859-1:1987", "iso_8859-2", "iso_8859-2:1987", "iso_8859-3",
            "iso_8859-3:1988", "iso_8859-4", "iso_8859-4:1988", "iso_8859-5",
            "iso_8859-5:1988", "iso_8859-6", "iso_8859-6:1987", "iso_8859-7",
            "iso_8859-7:1987", "iso_8859-8", "iso_8859-8:1988", "iso_8859-9",
            "iso_8859-9:1989", "koi", "koi8", "koi8-r", "koi8-ru", "koi8-u",
            "koi8_r", "korean", "ks_c_5601-1987", "ks_c_5601-1989", "ksc5601",
            "ksc_5601", "l1", "l2", "l3", "l4", "l5", "l6", "l9", "latin1",
            "latin2", "latin3", "latin4", "latin5", "latin6", "logical", "mac",
            "macintosh", "ms932", "ms_kanji", "shift-jis", "shift_jis", "sjis",
            "sun_eu_greek", "tis-620", "unicode-1-1-utf-8", "us-ascii",
            "utf-16", "utf-16be", "utf-16le", "utf-8", "utf8", "visual",
            "windows-1250", "windows-1251", "windows-1252", "windows-1253",
            "windows-1254", "windows-1255", "windows-1256", "windows-1257",
            "windows-1258", "windows-31j", "windows-874", "windows-949",
            "x-cp1250", "x-cp1251", "x-cp1252", "x-cp1253", "x-cp1254",
            "x-cp1255", "x-cp1256", "x-cp1257", "x-cp1258", "x-euc-jp", "x-gbk",
            "x-mac-cyrillic", "x-mac-roman", "x-mac-ukrainian", "x-sjis",
            "x-user-defined", "x-x-big5"];
            this.dialog = new Sao.Dialog(title, 'csv', 'lg');
            this.el = this.dialog.modal;

            this.fields = {};
            this.fields_model = {};
            jQuery('<button/>', {
                'class': 'btn btn-link',
                'type': 'button'
            }).append(Sao.i18n.gettext('Cancel')).click(function(){
                this.response('RESPONSE_CANCEL');
            }.bind(this)).appendTo(this.dialog.footer);

            jQuery('<button/>', {
                'class': 'btn btn-primary',
                'type': 'submit'
            }).append(Sao.i18n.gettext('OK')).click(function(e){
                this.response('RESPONSE_OK');
                e.preventDefault();
            }.bind(this)).appendTo(this.dialog.footer);

            var row_fields = jQuery('<div/>', {
                'class': 'row'
            }).appendTo(this.dialog.body);

            var column_fields_all = jQuery('<div/>', {
                'class': 'col-md-5',
            }).append(jQuery('<div/>', {
                'class': 'panel panel-default',
            }).append(jQuery('<div/>', {
                'class': 'panel-heading',
            }).append(jQuery('<h3/>', {
                'class': 'panel-title',
                'text': Sao.i18n.gettext('All Fields')
            })))).appendTo(row_fields);

            this.fields_all = jQuery('<ul/>', {
                'class': 'list-unstyled column-fields panel-body'
            }).css('cursor', 'pointer')
                .appendTo(column_fields_all.find('.panel'));

            var prm = this.get_fields(this.screen.model_name)
                .then(function(fields){
                    this.model_populate(fields);
                    this.view_populate(this.fields_model, this.fields_all);
                }.bind(this));

            this.column_buttons = jQuery('<div/>', {
                'class': 'col-md-2'
            }).appendTo(row_fields);

            var button_add = jQuery('<button/>', {
                'class': 'btn btn-default btn-block',
                'type': 'button'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add')
            ).click(function(){
                this.fields_all.find('.bg-primary').each(function(i, el_field) {
                    this.sig_sel_add(el_field);
                }.bind(this));
            }.bind(this)).append(' '+Sao.i18n.gettext('Add'))
            .appendTo(this.column_buttons);

            jQuery('<button/>', {
                'class': 'btn btn-default btn-block',
                'type': 'button'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-remove')
            ).click(function(){
                // sig_unsel
                this.fields_selected.children('li.bg-primary').remove();
            }.bind(this)).append(' '+Sao.i18n.gettext('Remove'))
            .appendTo(this.column_buttons);

            jQuery('<button/>', {
                'class': 'btn btn-default btn-block',
                'type': 'button'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-clear')
            ).click(function(){
                this.fields_selected.empty();
            }.bind(this)).append(' '+Sao.i18n.gettext('Clear'))
            .appendTo(this.column_buttons);

            jQuery('<hr>').appendTo(this.column_buttons);

            var column_fields_selected = jQuery('<div/>', {
                'class': 'col-md-5',
            }).append(jQuery('<div/>', {
                'class': 'panel panel-default',
            }).append(jQuery('<div/>', {
                'class': 'panel-heading',
            }).append(jQuery('<h3/>', {
                'class': 'panel-title',
                'text': Sao.i18n.gettext('Fields Selected')
            })))).appendTo(row_fields);

            // TODO: Make them draggable to re-order
            this.fields_selected = jQuery('<ul/>', {
                'class': 'list-unstyled column-fields panel-body',
            }).css('cursor', 'pointer')
                .appendTo(column_fields_selected.find('.panel'));

            this.chooser_form = jQuery('<div/>', {
                'class': 'row form-inline'
            }).appendTo(this.dialog.body);

            var row_csv_param = jQuery('<div/>', {
                'class': 'row'
            }).appendTo(this.dialog.body);

            var expander_icon = jQuery('<span/>', {
                'class': 'caret',
            }).css('cursor', 'pointer').html('&nbsp;');

            var csv_param_label = jQuery('<label/>', {
                'text': Sao.i18n.gettext('CSV Parameters')
            }).css('cursor', 'pointer');

            jQuery('<div/>', {
                'class': 'col-md-12'
            }).append(csv_param_label).append(expander_icon)
            .on('click', function(){
                this.expander_csv.collapse('toggle');
            }.bind(this)).appendTo(row_csv_param);

            this.expander_csv = jQuery('<div/>', {
                'id': 'expander_csv',
                'class': 'collapse col-md-12 form-inline'
            }).appendTo(row_csv_param);

            var delimiter_label = jQuery('<label/>', {
                'text': Sao.i18n.gettext('Delimiter:'),
                'class': 'control-label',
                'for': 'input-delimiter'
            });

            var separator = ',';
            if (navigator.platform &&
                    navigator.platform.slice(0, 3) == 'Win') {
                separator = ';';
            }
            this.el_csv_delimiter = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control',
                'id': 'input-delimiter',
                'size': '1',
                'maxlength': '1',
                'value': separator
            });

            jQuery('<div/>', {
                'class': 'form-group'
            }).append(delimiter_label)
                .append(this.el_csv_delimiter)
                .appendTo(this.expander_csv);
            this.expander_csv.append(' ');

            var quotechar_label = jQuery('<label/>', {
                'text': Sao.i18n.gettext('Quote Char:'),
                'class': 'control-label',
                'for': 'input-quotechar'
            });

            this.el_csv_quotechar = jQuery('<input/>', {
                'type': 'text',
                'class': 'form-control',
                'id': 'input-quotechar',
                'size': '1',
                'maxlength': '1',
                'value': '\"',
            });

            jQuery('<div/>', {
                'class': 'form-group'
            }).append(quotechar_label)
                .append(this.el_csv_quotechar)
                .appendTo(this.expander_csv);
            this.expander_csv.append(' ');

            var encoding_label = jQuery('<label/>', {
                'text': Sao.i18n.gettext('Encoding:'),
                'class': 'control-label',
                'for': 'input-encoding'
            });

            this.el_csv_encoding = jQuery('<select/>', {
                'class': 'form-control',
                'id': 'input-encoding'
            });

            for(var i=0; i<this.encodings.length; i++) {
                jQuery('<option/>', {
                    'val': this.encodings[i]
                }).html(this.encodings[i]).appendTo(this.el_csv_encoding);
            }

            var enc = 'utf-8';
            if (navigator.platform &&
                    navigator.platform.slice(0, 3) == 'Win') {
                enc = 'cp1252';
            }
            this.el_csv_encoding.children('option[value="' + enc + '"]')
            .attr('selected', 'selected');

            jQuery('<div/>', {
                'class': 'form-group'
            }).append(encoding_label)
                .append(this.el_csv_encoding)
                .appendTo(this.expander_csv);
            this.expander_csv.append(' ');

            this.el.modal('show');
            this.el.on('hidden.bs.modal', function() {
                jQuery(this).remove();
            });
            return prm;
        },
        get_fields: function(model) {
            return Sao.rpc({
                'method': 'model.' + model + '.fields_get'
            }, this.session);
        },
        on_row_expanded: function(node) {
            var container_view = jQuery('<ul/>').css('list-style', 'none')
                .insertAfter(node.view);
            this.children_expand(node).done(function() {
                this.view_populate(node.children, container_view);
            }.bind(this));
        },
        destroy: function() {
            this.el.modal('hide');
        }
    });

    Sao.Window.Import = Sao.class_(Sao.Window.CSV, {
        init: function(name, screen) {
            this.name = name;
            this.screen = screen;
            this.session = Sao.Session.current_session;
            this.fields_data = {}; // Ask before Removing this.
            this.fields_invert = {};
            Sao.Window.Import._super.init.call(this,
                Sao.i18n.gettext('CSV Import: %1', name));

            jQuery('<button/>', {
                'class': 'btn btn-default btn-block',
                'type': 'button'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-search')
            ).click(function(){
                this.autodetect();
            }.bind(this)).append(' '+Sao.i18n.gettext('Auto-Detect'))
            .appendTo(this.column_buttons);

            var chooser_label = jQuery('<label/>', {
                'text': Sao.i18n.gettext('File to Import'),
                'class': 'col-sm-6 control-label',
                'for': 'input-csv-file'
            });

            this.file_input = jQuery('<input/>', {
                'type': 'file',
                'id': 'input-csv-file'
            });

            jQuery('<div/>', {
                'class': 'form-group'
            }).append(chooser_label).append(jQuery('<div/>', {
                'class': 'col-sm-6'
            }).append(this.file_input))
            .appendTo(this.chooser_form);

            var skip_label = jQuery('<label/>', {
                'text': Sao.i18n.gettext('Lines to Skip:'),
                'class': 'control-label',
                'for': 'input-skip'
            });

            this.el_csv_skip = jQuery('<input/>', {
                'type': 'number',
                'class': 'form-control',
                'id': 'input-skip',
                'value': '0'
            });

            jQuery('<div/>', {
                'class': 'form-group'
            }).append(skip_label)
                .append(this.el_csv_skip)
                .appendTo(this.expander_csv);
            this.expander_csv.append(' ');
        },
        sig_sel_add: function(el_field) {
            el_field = jQuery(el_field);
            var field = el_field.attr('field');
            var node = jQuery('<li/>', {
                'field': field,
            }).html(el_field.attr('name')).click(function(e) {
                if (e.ctrlKey) {
                    node.toggleClass('bg-primary');
                } else {
                    jQuery(e.target).addClass('bg-primary')
                        .siblings().removeClass('bg-primary');
                }
            }).appendTo(this.fields_selected);
        },
        view_populate: function (parent_node, parent_view) {
            var fields_order = Object.keys(parent_node).sort(function(a,b) {
                if (parent_node[b].string < parent_node[a].string) {
                    return -1;
                }
                else {
                    return 1;
                }
            }).reverse();

            fields_order.forEach(function(field) {
                var name = parent_node[field].string || field;
                var node = jQuery('<li/>', {
                    'field': parent_node[field].field,
                    'name': parent_node[field].name
                }).html(name).click(function(e) {
                    if(e.ctrlKey) {
                        node.toggleClass('bg-primary');
                    } else {
                        this.fields_all.find('li').removeClass('bg-primary');
                        node.addClass('bg-primary');
                    }
                }.bind(this)).appendTo(parent_view);
                parent_node[field].view = node;
                var expander_icon = Sao.common.ICONFACTORY
                    .get_icon_img('tryton-arrow-right')
                    .data('expanded', false)
                    .click(function(e) {
                        e.stopPropagation();
                        var icon;
                        var expanded = expander_icon.data('expanded');
                        expander_icon.data('expanded', !expanded);
                        if (expanded) {
                            icon = 'tryton-arrow-right';
                            node.next('ul').remove();
                        } else {
                            icon = 'tryton-arrow-down';
                            this.on_row_expanded(parent_node[field]);
                        }
                        Sao.common.ICONFACTORY.get_icon_url(icon)
                            .then(function(url) {
                                expander_icon.attr('src', url);
                            });
                    }.bind(this)).prependTo(node);
                expander_icon.css(
                    'visibility',
                    parent_node[field].relation ? 'visible' : 'hidden');
            }.bind(this));
        },
        model_populate: function (fields, parent_node, prefix_field,
            prefix_name) {
            parent_node = parent_node || this.fields_model;
            prefix_field = prefix_field || '';
            prefix_name = prefix_name || '';

            Object.keys(fields).forEach(function(field) {
                if(!fields[field].readonly || field == 'id') {
                    var name = fields[field].string || field;
                    name = prefix_name + name;
                    // Only One2Many can be nested for import
                    var relation;
                    if (fields[field].type == 'one2many') {
                        relation = fields[field].relation;
                    } else {
                        relation = null;
                    }
                    var node = {
                        name: name,
                        field: prefix_field + field,
                        relation: relation,
                        string: fields[field].string
                    };
                    parent_node[field] = node;
                    this.fields[prefix_field + field] = node;
                    this.fields_invert[name] = prefix_field + field;
                    if (relation) {
                        node.children = {};
                    }
                }
            }.bind(this));
        },
        children_expand: function(node) {
            var dfd = jQuery.Deferred();
            if (jQuery.isEmptyObject(node.children)) {
                this.get_fields(node.relation).done(function(fields) {
                    this.model_populate(fields, node.children,
                        node.field + '/', node.name + '/');
                    dfd.resolve(this);
                }.bind(this));
            } else {
                dfd.resolve(this);
            }
            return dfd.promise();
        },
        autodetect: function() {
            var fname = this.file_input.val();
            if(!fname) {
                Sao.common.message.run(
                    Sao.i18n.gettext('You must select an import file first'));
                return;
            }
            this.fields_selected.empty();
            this.el_csv_skip.val(1);
            Papa.parse(this.file_input[0].files[0], {
                delimiter: this.el_csv_delimiter.val(),
                quoteChar: this.el_csv_quotechar.val(),
                preview: 1,
                encoding: this.el_csv_encoding.val(),
                error: function(err, file, inputElem, reason) {
                    Sao.common.warning(
                        Sao.i18n.gettext('Error occured in loading the file'));
                },
                complete: function(results) {
                    results.data[0].forEach(function(word) {
                        if(word in this.fields_invert || word in this.fields) {
                            this.auto_select(word);
                        }
                        else {
                            var fields = this.fields_model;
                            var prefix = '';
                            var parents = word.split('/');
                            this.traverse(fields, prefix, parents, 0);
                        }
                    }.bind(this));
                }.bind(this)
            });
        },
        auto_select: function(word) {
            var name,field;
            if(word in this.fields_invert) {
                name = word;
                field = this.fields_invert[word];
            }
            else if (word in this.fields) {
                name = this.fields[word].name;
                field = [word];
            }
            else {
                Sao.common.warning.run(
                    Sao.i18n.gettext(
                        'Error processing the file at field %1.', word),
                        Sao.i18n.gettext('Error'));
                return;
            }
            var node = jQuery('<li/>', {
                'field': field
            }).html(name).click(function(){
                node.addClass('bg-primary')
                    .siblings().removeClass('bg-primary');
            }).appendTo(this.fields_selected);
        },
        traverse: function(fields, prefix, parents, i) {
            if(i >= parents.length - 1) {
                this.auto_select(parents.join('/'));
                return;
            }
            var field, item;
            var names = Object.keys(fields);
            for(item = 0; item<names.length; item++) {
                field = fields[names[item]];
                if(field.name == (prefix+parents[i]) ||
                    field.field == (prefix+parents[i])) {
                    this.children_expand(field).done(callback);
                    break;
                }
            }
            if(item == names.length) {
                this.auto_select(parents.join('/'));
                return;
            }
            function callback(self) {
                fields = field.children;
                prefix += parents[i] + '/';
                self.traverse(fields, prefix, parents, ++i);
            }
        },
        response: function(response_id) {
            if(response_id == 'RESPONSE_OK') {
                var fields = [];
                this.fields_selected.children('li').each(function(i, field_el) {
                    fields.push(field_el.getAttribute('field'));
                });
                var fname = this.file_input.val();
                if(fname) {
                    this.import_csv(fname, fields).then(function() {
                        this.destroy();
                    }.bind(this));
                } else {
                    this.destroy();
                }
            }
            else {
                this.destroy();
            }
        },
        import_csv: function(fname, fields) {
            var skip = this.el_csv_skip.val();
            var encoding = this.el_csv_encoding.val();
            var prm = jQuery.Deferred();

            Papa.parse(this.file_input[0].files[0], {
                delimiter: this.el_csv_delimiter.val(),
                quoteChar: this.el_csv_quotechar.val(),
                encoding: encoding,
                error: function(err, file, inputElem, reason) {
                    Sao.common.warning.run(
                        Sao.i18n.gettext('Error occured in loading the file'))
                        .always(prm.reject);
                },
                complete: function(results) {
                    var data = results.data.slice(skip, results.data.length - 1);
                    Sao.rpc({
                        'method': 'model.' + this.screen.model_name +
                        '.import_data',
                        'params': [fields, data, {}]
                    }, this.session).then(function(count) {
                        return Sao.common.message.run(
                            Sao.i18n.ngettext('%1 record imported',
                                '%1 records imported', count));
                    }).then(prm.resolve, prm.reject);
                }.bind(this)
            });
            return prm.promise();
        }
    });

    Sao.Window.Export = Sao.class_(Sao.Window.CSV, {
        init: function(name, screen, ids, names, context) {
            this.name = name;
            this.ids = ids;
            this.screen = screen;
            this.session = Sao.Session.current_session;
            this.context = context;
            Sao.Window.Export._super.init.call(this,
                Sao.i18n.gettext('CSV Export: %1',name)).then(function() {
                    var fields = this.screen.model.fields;
                    names.forEach(function(name) {
                        var type = fields[name].description.type;
                        if (type == 'selection') {
                            this.sel_field(name + '.translated');
                        } else if (type == 'reference') {
                            this.sel_field(name + '.translated');
                            this.sel_field(name + '/rec_name');
                        } else {
                            this.sel_field(name);
                        }
                    }.bind(this));
                }.bind(this));

            this.predef_exports = {};
            this.fill_predefwin();

            jQuery('<button/>', {
                'class': 'btn btn-default btn-block',
                'type': 'button'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-save')
            ).click(function(){
                this.addreplace_predef();
            }.bind(this)).append(' '+Sao.i18n.gettext('Save Export'))
            .appendTo(this.column_buttons);

            jQuery('<button/>', {
                'class': 'btn btn-default btn-block',
                'type': 'button'
            }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-delete')
            ).click(function(){
                this.remove_predef();
            }.bind(this)).append(' '+Sao.i18n.gettext('Delete Export'))
            .appendTo(this.column_buttons);

            var predefined_exports_column = jQuery('<div/>', {
                'class': 'panel panel-default',
            }).append(jQuery('<div/>', {
                'class': 'panel-heading',
            }).append(jQuery('<h3/>', {
                'class': 'panel-title',
                'text': Sao.i18n.gettext('Predefined Exports')
            }))).appendTo(this.column_buttons);

            this.predef_exports_list = jQuery('<ul/>', {
                'class': 'list-unstyled predef-exports panel-body'
            }).css('cursor', 'pointer')
            .appendTo(predefined_exports_column);

            this.el_csv_locale = jQuery('<input/>', {
                'type': 'checkbox',
                'checked': 'checked',
            });

            jQuery('<div/>', {
                'class': 'checkbox',
            }).append(jQuery('<label/>', {
                'text': ' ' + Sao.i18n.gettext("Use locale format"),
            }).prepend(this.el_csv_locale)).appendTo(this.expander_csv);
            this.expander_csv.append(' ');

            this.el_add_field_names = jQuery('<input/>', {
                'type': 'checkbox',
                'checked': 'checked'
            });

            jQuery('<div/>', {
                'class': 'checkbox',
            }).append(jQuery('<label/>', {
                'text': ' '+Sao.i18n.gettext('Add Field Names')
            }).prepend(this.el_add_field_names)).appendTo(this.expander_csv);
            this.expander_csv.append(' ');
        },
        view_populate: function(parent_node, parent_view) {
            var names = Object.keys(parent_node).sort(function(a, b) {
                if (parent_node[b].string < parent_node[a].string) {
                    return -1;
                }
                else {
                    return 1;
                }
            }).reverse();

            names.forEach(function(name) {
                var path = parent_node[name].path;
                var node = jQuery('<li/>', {
                    'path': path
                }).html(parent_node[name].string).click(function(e) {
                    if(e.ctrlKey) {
                        node.toggleClass('bg-primary');
                    } else {
                        this.fields_all.find('li')
                            .removeClass('bg-primary');
                        node.addClass('bg-primary');
                    }
                }.bind(this)).appendTo(parent_view);
                parent_node[name].view = node;

                var expander_icon = Sao.common.ICONFACTORY
                    .get_icon_img('tryton-arrow-right')
                    .data('expanded', false)
                    .click(function(e) {
                        e.stopPropagation();
                        var icon;
                        var expanded = expander_icon.data('expanded');
                        expander_icon.data('expanded', !expanded);
                        if (expanded) {
                            icon = 'tryton-arrow-right';
                            node.next('ul').remove();
                        } else {
                            icon = 'tryton-arrow-down';
                            this.on_row_expanded(parent_node[name]);
                        }
                        Sao.common.ICONFACTORY.get_icon_url(icon)
                            .then(function(url) {
                                expander_icon.attr('src', url);
                            });
                    }.bind(this)).prependTo(node);
                expander_icon.css(
                    'visibility',
                    parent_node[name].children ? 'visible' : 'hidden');
            }.bind(this));
        },
        model_populate: function(fields, parent_node, prefix_field,
            prefix_name) {
            parent_node = parent_node || this.fields_model;
            prefix_field = prefix_field || '';
            prefix_name = prefix_name || '';

            Object.keys(fields).forEach(function(name) {
                var field = fields[name];
                var string = field.string || name;
                var items = [{ name: name, field: field, string: string }];

                if (field.type == 'selection') {
                    items.push({
                        name: name+'.translated',
                        field: field,
                        string: Sao.i18n.gettext('%1 (string)', string)
                    });
                } else if (field.type == 'reference') {
                    items.push({
                        name: name + '.translated',
                        field: field,
                        string: Sao.i18n.gettext("%1 (model name)", string),
                    });
                    items.push({
                        name: name + '/rec_name',
                        field: field,
                        string: Sao.i18n.gettext("%1 (record name)", string),
                    });
                }

                items.forEach(function(item) {
                    var path = prefix_field + item.name;
                    var long_string = item.string;

                    if (prefix_field) {
                        long_string = prefix_name + item.string;
                    }

                    var node = {
                        path: path,
                        string: item.string,
                        long_string: long_string,
                        relation: item.field.relation
                    };
                    parent_node[item.name] = node;
                    this.fields[path] = node;

                    // Insert relation only to real field
                    if (item.name.indexOf('.') == -1 && item.field.relation) {
                        node.children = {};
                    }
                }.bind(this));
            }.bind(this));
        },
        children_expand: function(node) {
            var dfd = jQuery.Deferred();
            if(jQuery.isEmptyObject(node.children)) {
                this.get_fields(node.relation).done(function(fields) {
                    this.model_populate(fields, node.children,
                        node.path + '/', node.string + '/');
                    dfd.resolve(this);
                }.bind(this));
            } else {
                dfd.resolve(this);
            }
            return dfd.promise();
        },
        sig_sel_add: function(el_field) {
            el_field = jQuery(el_field);
            var name = el_field.attr('path');
            this.sel_field(name);
        },
        fill_predefwin: function() {
            Sao.rpc({
                'method': 'model.ir.export.search_read',
                'params': [
                    [['resource', '=', this.screen.model_name]], 0, null, null,
                    ['name', 'export_fields.name'], {}],
            }, this.session).done(function(exports) {
                exports.forEach(function(export_) {
                    this.predef_exports[export_.id] = export_['export_fields.']
                        .map(function(field) {return field.name;});
                    this.add_to_predef(export_.id, export_.name);
                    this.predef_exports_list.children('li').first().focus();
                }.bind(this));
            }.bind(this));
        },
        add_to_predef: function(id, name) {
            var node = jQuery('<li/>', {
                'text': name,
                'export_id': id,
                'tabindex': 0
            }).on('keypress', function(e) {
                var keyCode = (e.keyCode ? e.keyCode : e.which);
                if(keyCode == 13 || keyCode == 32) {
                    node.click();
                }
            }).click(function(event) {
                node.addClass('bg-primary')
                    .siblings().removeClass('bg-primary');
                this.sel_predef(jQuery(event.target).attr('export_id'));
            }.bind(this));
            this.predef_exports_list.append(node);
        },
        addreplace_predef: function() {
            var fields = [];
            var selected_fields = this.fields_selected.children('li');
            for(var i=0; i<selected_fields.length; i++) {
                fields.push(selected_fields[i].getAttribute('path'));
            }
            if(fields.length === 0) {
                return;
            }
            var pref_id, name;
            var selection = this.predef_exports_list.children('li.bg-primary');
            if (selection.length === 0) {
                pref_id = null;
                Sao.common.ask.run(
                    Sao.i18n.gettext('What is the name of this export?'))
                .then(function(name) {
                    if (!name) {
                        return;
                    }
                    this.save_predef(name, fields, selection);
                }.bind(this));
            }
            else {
                pref_id = selection.attr('export_id');
                name = selection.text();
                Sao.common.sur.run(
                    Sao.i18n.gettext('Override %1 definition?', name))
                .done(function() {
                    this.save_predef(name, fields, selection);
                    Sao.rpc({
                        'method': 'model.ir.export.delete',
                        'params': [[pref_id], {}]
                    }, this.session).then(function() {
                        delete this.predef_exports[pref_id];
                    }.bind(this));
                }.bind(this));
            }
        },
        save_predef: function(name, fields, selection) {
            Sao.rpc({
                'method': 'model.ir.export.create',
                'params': [[{
                    'name': name,
                    'resource': this.screen.model_name,
                    'export_fields': [['create', fields.map(function(x) {
                        return {
                            'name': x
                        };
                    })]]
                }], {}]
            }, this.session).then(function(new_id) {
                this.session.cache.clear(
                    'model.' + this.screen.model_name + '.view_toolbar_get');
                this.predef_exports[new_id] = fields;
                if (selection.length === 0) {
                    this.add_to_predef(new_id, name);
                }
                else {
                    this.predef_exports[new_id] = fields;
                    selection.attr('export_id', new_id);
                }
            }.bind(this));
        },
        remove_predef: function() {
            var selection = this.predef_exports_list.children('li.bg-primary');
            if (selection.length === 0) {
                return;
            }
            var export_id = jQuery(selection).attr('export_id');
            Sao.rpc({
                'method': 'model.ir.export.delete',
                'params': [[export_id], {}]
            }, this.session).then(function() {
                this.session.cache.clear(
                    'model.' + this.screen.model_name + '.view_toolbar_get');
                delete this.predef_exports[export_id];
                selection.remove();
            }.bind(this));
        },
        sel_predef: function(export_id) {
            this.fields_selected.empty();
            this.predef_exports[export_id].forEach(function(name) {
                if (!(name in this.fields)) {
                    var fields = this.fields_model;
                    var prefix = '';
                    var parents = name.split('/');
                    this.traverse(fields, prefix, parents, 0);
                }
                if(!(name in this.fields)) {
                    return;
                }
                this.sel_field(name);
            }.bind(this));
        },
        traverse: function(fields, prefix, parents, i) {
            if(i >= parents.length-1) {
                this.sel_field(parents.join('/'));
                return;
            }
            var field, item;
            var names = Object.keys(fields);
            for(item = 0; item < names.length; item++) {
                field = fields[names[item]];
                if(field.path == (prefix+parents[i])) {
                    this.children_expand(field).done(callback);
                    break;
                }
            }
            if(item == names.length) {
                this.sel_field(parents.join('/'));
                return;
            }
            function callback(self){
                fields = field.children;
                prefix += parents[i] + '/';
                self.traverse(fields, prefix, parents, ++i);
            }
        },
        sel_field: function(name) {
            var long_string = this.fields[name].long_string;
            var relation = this.fields[name].relation;
            if (relation) {
                return;
            }
            var node = jQuery('<li/>', {
                'path': name,
            }).html(long_string).click(function(e) {
                if(e.ctrlKey) {
                    node.toggleClass('bg-primary');
                } else {
                    jQuery(e.target).addClass('bg-primary')
                        .siblings().removeClass('bg-primary');
                }
            }).appendTo(this.fields_selected);
        },
        response: function(response_id) {
            if(response_id == 'RESPONSE_OK') {
                var fields = [];
                var fields2 = [];
                this.fields_selected.children('li').each(function(i, field) {
                    fields.push(field.getAttribute('path'));
                    fields2.push(field.innerText);
                });
                Sao.rpc({
                    'method': 'model.' + this.screen.model_name +
                        '.export_data',
                    'params': [this.ids, fields, this.context]
                }, this.session).then(function(data) {
                    this.export_csv(fields2, data).then(function() {
                        this.destroy();
                    }.bind(this));
                }.bind(this));
            } else {
                this.destroy();
            }
        },
        export_csv: function(fields, data) {
            var encoding = this.el_csv_encoding.val();
            var locale_format = this.el_csv_locale.prop('checked');
            var unparse_obj = {};
            unparse_obj.data = [];
            data.forEach(function(line) {
                var row = [];
                line.forEach(function(val) {
                    if (locale_format) {
                        if (val.isDateTime) {
                            val = val.format(
                                Sao.common.date_format() + ' ' +
                                Sao.common.moment_format('%X'));
                        } else if (val.isDate) {
                            val = val.format(Sao.common.date_format());
                        } else if (!isNaN(Number(val))) {
                            val = val.toLocaleString(
                                Sao.i18n.BC47(Sao.i18n.getlang()));
                        }
                    } else if (typeof(val) == 'boolean') {
                        val += 0;
                    }
                    row.push(val);
                });
                unparse_obj.data.push(row);
            });
            if (this.el_add_field_names.is(':checked')) {
                unparse_obj.fields = fields;
            }
            var csv = Papa.unparse(unparse_obj, {
                quoteChar: this.el_csv_quotechar.val(),
                delimiter: this.el_csv_delimiter.val()
            });
            Sao.common.download_file(
                csv, this.name + '.csv', {type: 'text/csv;charset=' + encoding});
            return Sao.common.message.run(
                Sao.i18n.ngettext('%1 record saved', '%1 records saved',
                    data.length));
        }
    });

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Wizard = Sao.class_(Object, {
        init: function(name) {
            this.widget = jQuery('<div/>', {
                'class': 'wizard'
            });
            this.name = name || '';
            this.action_id = null;
            this.id = null;
            this.ids = null;
            this.action = null;
            this.context = null;
            this.states = {};
            this.session_id = null;
            this.start_state = null;
            this.end_state = null;
            this.screen = null;
            this.screen_state = null;
            this.state = null;
            this.session = Sao.Session.current_session;
            this.__processing = false;
            this.__waiting_response = false;
            this.info_bar = new Sao.Window.InfoBar();
        },
        run: function(attributes) {
            this.action = attributes.action;
            this.action_id = attributes.data.action_id;
            this.id = attributes.data.id;
            this.ids = attributes.data.ids;
            this.model = attributes.data.model;
            this.context = jQuery.extend({}, attributes.context);
            this.context.active_id = this.id;
            this.context.active_ids = this.ids;
            this.context.active_model = this.model;
            this.context.action_id = this.action_id;
            Sao.rpc({
                'method': 'wizard.' + this.action + '.create',
                'params': [this.session.context]
            }, this.session).then(function(result) {
                this.session_id = result[0];
                this.start_state = this.state = result[1];
                this.end_state = result[2];
                this.process();
            }.bind(this), function() {
                this.destroy();
            }.bind(this));
        },
        process: function() {
            if (this.__processing || this.__waiting_response) {
                return;
            }
            var process = function() {
                if (this.state == this.end_state) {
                    this.end();
                    return;
                }
                var ctx = jQuery.extend({}, this.context);
                var data = {};
                if (this.screen) {
                    data[this.screen_state] = this.screen.get_on_change_value();
                }
                Sao.rpc({
                    'method': 'wizard.' + this.action + '.execute',
                    'params': [this.session_id, data, this.state, ctx]
                }, this.session).then(function(result) {
                    if (result.view) {
                        this.clean();
                        var view = result.view;
                        this.update(view.fields_view, view.buttons);

                        this.screen.new_(false).then(function() {
                            this.screen.current_record.set_default(view.defaults);
                            this.screen.set_cursor();
                        }.bind(this));

                        this.screen_state = view.state;
                        this.__waiting_response = true;
                    } else {
                        this.state = this.end_state;
                    }

                    var execute_actions = function execute_actions() {
                        if (result.actions) {
                            result.actions.forEach(function(action) {
                                var context = jQuery.extend({}, this.context);
                                // Remove wizard keys added by run
                                delete context.active_id;
                                delete context.active_ids;
                                delete context.active_model;
                                delete context.action_id;
                                Sao.Action.exec_action(action[0], action[1],
                                    context);
                            }.bind(this));
                        }
                    }.bind(this);

                    if (this.state == this.end_state) {
                        this.end().then(execute_actions);
                    } else {
                        execute_actions();
                    }
                    this.__processing = false;
                }.bind(this), function(result) {
                    // TODO end for server error.
                    this.__processing = false;
                }.bind(this));
            };
            process.call(this);
        },
        destroy: function(action) {
            // TODO
        },
        end: function() {
            return Sao.rpc({
                'method': 'wizard.' + this.action + '.delete',
                'params': [this.session_id, this.session.context]
            }, this.session).then(function(action) {
                this.destroy(action);
            }.bind(this));
        },
        clean: function() {
            this.widget.children().remove();
            this.states = {};
        },
        response: function(state) {
            this.__waiting_response = false;
            this.screen.current_view.set_value();
            return this.screen.current_record.validate().then(function(validate) {
                if ((!validate) && state != this.end_state) {
                    this.screen.display(true);
                    this.info_bar.message(
                        this.screen.invalid_message(), 'danger');
                    return;
                }
                this.info_bar.message();
                this.state = state;
                this.process();
            }.bind(this));
        },
        _get_button: function(definition) {
            var button = new Sao.common.Button(definition);
            this.states[definition.state] = button;
            if (definition.default) {
                button.el.addClass('btn-primary');
            } else if (definition.state == this.end_state) {
                button.el.addClass('btn-link');
            }
            return button;
        },
        update: function(view, buttons) {
            buttons.forEach(function(button) {
                this._get_button(button);
            }.bind(this));
            this.screen = new Sao.Screen(view.model,
                    {mode: [], context: this.context});
            this.screen.add_view(view);
            this.screen.switch_view();
            // TODO record-modified
            // TODO title
            // TODO toolbar
            this.widget.append(this.screen.screen_container.el);
        }
    });

    Sao.Wizard.create = function(attributes) {
        var win;
        if (attributes.window) {
            win = new Sao.Wizard.Form(attributes.name);
            var tab = new Sao.Tab.Wizard(win);
            Sao.Tab.add(tab);
        } else {
            win = new Sao.Wizard.Dialog(attributes.name);
        }
        win.run(attributes);
    };

    Sao.Wizard.Form = Sao.class_(Sao.Wizard, {
        init: function(name) {
            Sao.Wizard.Form._super.init.call(this);
            this.tab = null;  // Filled by Sao.Tab.Wizard
            this.name = name || '';

            this.form = jQuery('<div/>', {
                'class': 'wizard-form',
            }).append(this.widget);
            this.footer = jQuery('<div/>', {
                'class': 'modal-footer'
            }).appendTo(this.form);
        },
        clean: function() {
            Sao.Wizard.Form._super.clean.call(this);
            this.footer.children().remove();
        },
        _get_button: function(definition) {
            var button = Sao.Wizard.Form._super._get_button.call(this,
                definition);
            this.footer.append(button.el);
            button.el.click(function() {
                this.response(definition.state);
            }.bind(this));
            return button;
        },
        destroy: function(action) {
            Sao.Wizard.Form._super.destroy.call(this, action);
            switch (action) {
                case 'reload menu':
                    Sao.Session.current_session.reload_context()
                        .then(function() {
                            Sao.menu();
                        });
                    break;
                case 'reload context':
                    Sao.Session.current_session.reload_context();
                    break;
            }
        },
        end: function() {
            return Sao.Wizard.Form._super.end.call(this).always(function() {
                return this.tab.close();
            }.bind(this));
        }
    });

    Sao.Wizard.Dialog = Sao.class_(Sao.Wizard, { // TODO nomodal
        init: function(name) {
            if (!name) {
                name = Sao.i18n.gettext('Wizard');
            }
            Sao.Wizard.Dialog._super.init.call(this);
            var dialog = new Sao.Dialog(name, 'wizard-dialog', 'md', false);
            this.dialog = dialog.modal;
            this.content = dialog.content;
            this.footer = dialog.footer;
            this.dialog.on('keydown', function(e) {
                if (e.which == Sao.common.ESC_KEYCODE) {
                    e.preventDefault();
                    if (this.end_state in this.states) {
                        this.response(this.end_state);
                    }
                }
            }.bind(this));
            dialog.body.append(this.widget).append(this.info_bar.el);
        },
        clean: function() {
            Sao.Wizard.Dialog._super.clean.call(this);
            this.footer.children().remove();
        },
        _get_button: function(definition) {
            var button = Sao.Wizard.Dialog._super._get_button.call(this,
                    definition);
            this.footer.append(button.el);
            if (definition['default']) {
                this.content.unbind('submit');
                this.content.submit(function(e) {
                    this.response(definition.state);
                    e.preventDefault();
                }.bind(this));
                button.el.attr('type', 'submit');
            } else {
                button.el.click(function() {
                    this.response(definition.state);
                }.bind(this));
            }
            return button;
        },
        update: function(view, buttons) {
            this.content.unbind('submit');
            Sao.Wizard.Dialog._super.update.call(this, view, buttons);
            this.show();
        },
        destroy: function(action) {
            Sao.Wizard.Dialog._super.destroy.call(this, action);
            var destroy = function() {
                this.dialog.remove();
                var dialog = jQuery('.wizard-dialog').filter(':visible')[0];
                var is_menu = false;
                var screen;
                if (!dialog) {
                    dialog = Sao.Tab.tabs.get_current();
                }
                if (!dialog ||
                    !this.model ||
                    (Sao.main_menu_screen.model_name == this.model)) {
                    is_menu = true;
                    screen = Sao.main_menu_screen;
                } else {
                    screen = dialog.screen;
                }
                if (screen) {
                    var prm = jQuery.when();
                    if (screen.current_record && !is_menu) {
                        var ids;
                        if (screen.model_name == this.model) {
                            ids = this.ids;
                        } else {
                            // Wizard run form a children record so reload
                            // parent record
                            ids = [screen.current_record.id];
                        }
                        prm = screen.reload(ids, true);
                    }
                    if (action) {
                        prm.then(function() {
                            screen.client_action(action);
                        });
                    }
                }
            }.bind(this);
            if ((this.dialog.data('bs.modal') || {}).isShown) {
                this.dialog.on('hidden.bs.modal', destroy);
                this.dialog.modal('hide');
            } else {
                destroy();
            }
        },
        show: function() {
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
                        if (widget.expand) {
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
        },
        hide: function() {
            this.dialog.modal('hide');
        },
        state_changed: function() {
            this.process();
        }
    });

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.View.Board = Sao.class_(Object, {
        init: function(view_xml, context) {
            var attributes, attribute, node, actions_prms;

            this.context = context;
            this.actions = [];
            this.el = jQuery('<div/>', {
                'class': 'board'
            });

            attributes = {};
            node = view_xml.children()[0];
            for (var i = 0, len = node.attributes.length; i < len; i++) {
                attribute = node.attributes[i];
                attributes[attribute.name] = attribute.value;
            }
            this.attributes = attributes;
            this.el.append(this.parse(node).el);

            actions_prms = [];
            for (i = 0, len = this.actions.length; i < len; i++) {
                actions_prms.push(this.actions[i].action_prm);
            }
            this.actions_prms = jQuery.when.apply(jQuery, actions_prms);
        },
        _parse_node: function(child, container, attributes) {
            switch (child.tagName) {
                case 'image':
                    break;
                case 'separator':
                    this._parse_separator(child, container, attributes);
                    break;
                case 'label':
                    this._parse_label(child, container, attributes);
                    break;
                case 'newline':
                    container.add_row();
                    break;
                case 'notebook':
                    this._parse_notebook(child, container, attributes);
                    break;
                case 'page':
                    this._parse_page(child, container, attributes);
                    break;
                case 'group':
                    this._parse_group(child, container, attributes);
                    break;
                case 'hpaned':
                    this._parse_pane(child, container, attributes,
                            'horizontal');
                    break;
                case 'vpaned':
                    this._parse_pane(child, container, attributes,
                            'vertical');
                    break;
                case 'child':
                    this._parse_child(child, container, attributes);
                    break;
                case 'action':
                    this._parse_action(child, container, attributes);
                    break;
            }
        },
        parse: function(node, container) {
            var _parse;
            if (!container) {
                container = new Sao.View.Form.Container(
                        Number(node.getAttribute('col') || 4));
            }
            _parse = function(index, child) {
                var attributes, attribute;
                var i, len;
                attributes = {};
                for (i = 0, len = child.attributes.length; i < len; i++) {
                    attribute = child.attributes[i];
                    attributes[attribute.name] = attribute.value;
                }
                ['yexpand', 'yfill', 'xexpand', 'xfill', 'colspan',
                 'position'].forEach(function(name) {
                     if (attributes[name]) {
                         attributes[name] = Number(attributes[name]);
                     }
                });
                this._parse_node(child, container, attributes);
            };
            jQuery(node).children().each(_parse.bind(this));
            return container;
        },
        _parse_separator: function(node, container, attributes) {
            var text, separator;
            text = attributes.string;
            separator = new Sao.view.Form.Separator(text, attributes);
            container.add(separator, attributes);
        },
        _parse_label: function(node, container, attributes) {
            var text, label;
            text = attributes.string;
            if (!text) {
                container.add(null, attributes);
                return;
            }
            label = new Sao.View.Form.Label(text, attributes);
            container.add(label, attributes);
        },
        _parse_notebook: function(node, container, attributes) {
            var notebook;
            if (attributes.yexpand === undefined) {
                attributes.yexpand = true;
            }
            if (attributes.yfill === undefined) {
                attributes.yfill = true;
            }
            notebook = new Sao.View.Form.Notebook(attributes);
            container.add(notebook, attributes);
            this.parse(node, container);
        },
        _parse_page: function(node, container, attributes) {
            var text;
            text = attributes.string;
            page = this.parse(node, container);
            page = new Sao.View.Form.Page(container.add(page.el, text),
                    attributes);
        },
        _parse_group: function(node, container, attributes) {
            var group;
            group = new Sao.View.Form.Group(attributes);
            container.add(group, attributes);
        },
        _parse_pane: function(node, container, attributes, orientation) {
            var paned;
            if (attributes.yexpand === undefined) {
                attributes.yexpand = true;
            }
            if (attributes.yfill === undefined) {
                attributes.yfill = true;
            }
            paned = new Sao.common.Paned(orientation);
            container.add(paned, attributes);
            this.parse(node, paned);
        },
        _parse_child: function(node, paned, attributes) {
            var container, child1, child2;
            container = this.parse(node);
            child1 = paned.get_child1();
            if (child1.children().length > 0) {
                child2 = paned.get_child2();
                child2.append(container.el);
            } else {
                child1.append(container.el);
            }
        },
        _parse_action: function(node, container, attributes) {
            var action;
            if (attributes.yexpand === undefined) {
                attributes.yexpand = true;
            }
            if (attributes.yfill === undefined) {
                attributes.yfill = true;
            }
            action = new Sao.View.Board.Action(attributes, this.context);
            this.actions.push(action);
            container.add(action, attributes);
        },
        reload: function() {
            for (var i = 0; i < this.actions.length; i++) {
                this.actions[i].display();
            }
        }
    });

    Sao.View.Board.Action = Sao.class_(Object, {
        init: function(attributes, context) {
            if (context === undefined) {
                context = {};
            }
            var model, action_prm, act_window;
            var decoder, search_context, search_value;

            this.name = attributes.name;
            this.context = jQuery.extend({}, context);

            act_window = new Sao.Model('ir.action.act_window');
            this.action_prm = act_window.execute('get', [this.name],
                    this.context);
            this.action_prm.done(function(action) {
                var i, len;
                var view_ids, decoder, search_context;
                var screen_attributes, action_modes;

                this.action = action;
                this.action.mode = [];
                view_ids = [];
                if ((this.action.views || []).length > 0) {
                    for (i = 0, len = this.action.views.length; i < len; i++) {
                        view_ids.push(this.action.views[i][0]);
                        this.action.mode.push(this.action.views[i][1]);
                    }
                } else if (this.action.view_id !== undefined) {
                    view_ids = [this.action.view_id[0]];
                }

                if ('mode' in attributes) {
                    this.action.mode = attributes.mode;
                }

                if (!('pyson_domain' in this.action)) {
                    this.action.pyson_domain = '[]';
                }

                jQuery.extend(this.context,
                        Sao.Session.current_session.context);
                this.context._user = Sao.Session.current_session.user_id;
                decoder = new Sao.PYSON.Decoder(this.context);
                jQuery.extend(this.context,
                        decoder.decode(this.action.pyson_context || '{}'));
                decoder = new Sao.PYSON.Decoder(this.context);
                jQuery.extend(this.context,
                        decoder.decode(this.action.pyson_context || '{}'));

                this.domain = [];
                this.update_domain([]);

                search_context = jQuery.extend({}, this.context);
                search_context.context = this.context;
                search_context._user = Sao.Session.current_session.user_id;
                decoder = new Sao.PYSON.Decoder(search_context);
                search_value = decoder.decode(
                        this.action.pyson_search_value || '[]');

                screen_attributes = {
                    mode: this.action.mode,
                    context: this.context,
                    view_ids: view_ids,
                    domain: this.domain,
                    search_value: search_value,
                    row_activate: this.row_activate.bind(this),
                };
                this.screen = new Sao.Screen(this.action.res_model,
                        screen_attributes);

                if (attributes.string) {
                    this.title.html(attributes.string);
                } else {
                    this.title.html(this.action.name);
                }
                this.screen.switch_view().done(function() {
                    this.body.append(this.screen.screen_container.el);
                    this.screen.search_filter();
                }.bind(this));
            }.bind(this));
            this.el = jQuery('<div/>', {
                'class': 'board-action panel panel-default',
            });
            this.title = jQuery('<div/>', {
                'class': 'panel-heading',
            });
            this.el.append(this.title);
            this.body = jQuery('<div/>', {
                'class': 'panel-body',
            });
            this.el.append(this.body);
        },
        row_activate: function() {
            var record_ids, win;

            if (!this.screen.current_record) {
                return;
            }

            if (this.screen.current_view.view_type == 'tree' &&
                    (this.screen.current_view.attributes.keyword_open == 1)) {
                record_ids = this.screen.current_view.selected_records.map(
                        function(record) { return record.id; });
                Sao.Action.exec_keyword('tree_open', {
                    model: this.screen.model_name,
                    id: this.screen.current_record.id,
                    ids: record_ids
                }, jQuery.extend({}, this.screen.group._context), false);
            } else {
                win = new Sao.Window.Form(this.screen, function(result) {
                    if (result) {
                        this.screen.current_record.save();
                    } else {
                        this.screen.current_record.cancel();
                    }
                }.bind(this));
            }
        },
        set_value: function() {
        },
        display: function() {
            this.screen.search_filter(this.screen.screen_container.get_text());
        },
        get_active: function() {
            if (this.screen && this.screen.current_record) {
                return Sao.common.EvalEnvironment(this.screen.current_record);
            }
        },
        update_domain: function(actions) {
            var i, len;
            var active, domain_ctx, decoder, new_domain;

            domain_ctx = jQuery.extend({}, this.context);
            domain_ctx.context = domain_ctx;
            domain_ctx._user = Sao.Session.current_session.user_id;
            for (i = 0, len = actions.length; i < len; i++) {
                active = actions[i].get_active();
                if (active) {
                    domain_ctx[actions[i].name] = active;
                }
            }
            decoder = new Sao.PYSON.Decoder(domain_ctx);
            new_domain = decoder.decode(this.action.pyson_domain);
            if (Sao.common.compare(this.domain, new_domain)) {
                return;
            }
            this.domain.splice(0, this.domain.length);
            jQuery.extend(this.domain, new_domain);
            if (this.screen) {
                this.display();
            }
        }
    });
}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Bus = {};

    // Bus Identifier
    Sao.Bus.id = Sao.common.uuid4();
    Sao.Bus.channels = ['client:' + Sao.Bus.id];

    Sao.Bus.listen = function(last_message, wait) {
        wait = wait || 1;
        var session = Sao.Session.current_session;
        if (!session) {
            return;
        }

        var prm = jQuery.ajax({
            headers: {
                Authorization: 'Session ' + session.get_auth(),
            },
            contentType: 'application/json',
            data: JSON.stringify({
                last_message: last_message,
                channels: Sao.Bus.channels
            }),
            dataType: 'json',
            url: '/' + session.database + '/bus',
            type: 'POST',
            timeout: Sao.config.bus_timeout,
        });

        prm.done(function(response) {
            if (Sao.Session.current_session != session) {
                return;
            }
            if (response.message) {
                last_message = response.message.message_id;
                Sao.Bus.handle(response.message);
            }
            Sao.Bus.listen(last_message, 1);
        });

        prm.fail(function(response, status, error) {
            if (Sao.Session.current_session != session) {
                return;
            }
            if (error === "timeout") {
                Sao.Bus.listen(last_message, 1);
            } else if (response.status == 501) {
                console.log("Bus not supported");
                return;
            } else {
                window.setTimeout(
                    Sao.Bus.listen,
                    Math.min(wait * 1000, Sao.config.bus_timeout),
                    last_message, wait * 2);
            }
        });
    };

    Sao.Bus.handle = function(message) {
        var notify = function(message) {
            try {
                if (Notification.permission != "granted") {
                    return;
                }
            } catch (e) {
                (console.error || console.log).call(console, e, e.stack);
                return;
            }

            new Notification(message.title, {
                body: message.body || '',
            });
        };

        switch (message.type) {
            case 'notification':
                notify(message);
                break;
        }
    };

}());

/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */

(function() {
    'use strict';

    var Translate = {};
    Translate.translate_view = function(data) {
        var model = data.model;
        Sao.Tab.create({
            model: 'ir.translation',
            domain: [['model', '=', model]],
            mode: ['tree', 'form'],
            name: Sao.i18n.gettext('Translate view'),
        });
    };
    Translate.get_plugins = function(model) {
        var access = Sao.common.MODELACCESS.get(model);
        if (access.create && access.write) {
            return [
                [Sao.i18n.gettext('Translate view'), Translate.translate_view],
            ];
        } else {
            return [];
        }
    };

    Sao.Plugins.push(Translate);
}());



//Common.js
// Sao.config.pallete = {
//     'toolbar_icons':'white'
// };

Sao.config.icon_colors = {
    'toolbar_icons':'white',
    'default':'#3465a4',
  
};

//add Kalenis Addons
Sao.KalenisAddons = {};

Sao.common.IconFactory.prototype._convert= function(data, type) {
    var xml = jQuery.parseXML(data);

    // jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors[0]);
    //kalenis
    
    if(type && Sao.config.icon_colors[type]){
        jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors[type]);
    }
    else{
        jQuery(xml).find('svg').attr('fill', Sao.config.icon_colors.default);
    }
   

    data = new XMLSerializer().serializeToString(xml);
    var blob = new Blob([data],
        {type: 'image/svg+xml'});
    return window.URL.createObjectURL(blob);
};

Sao.common.IconFactory.prototype.get_icon_url =  function(icon_name, type) {
    if (!icon_name) {
        return jQuery.when('');
    }
    return this.register_icon(icon_name).then(function() {
        var complete_name = "";
        if(type){
            complete_name = icon_name.concat('_').concat(type);
        }
        else{
            complete_name = icon_name;
        }
        if (complete_name in this.loaded_icons) {
            
            return this.loaded_icons[complete_name];
        } else {
            return jQuery.get('images/' + icon_name + '.svg', null, null, 'text')
                .then(function(icon) {
                   
                    var img_url = this._convert(icon, type);
                    this.loaded_icons[complete_name] = img_url;
                    return img_url;
                }.bind(this));
        }
    }.bind(this));
};

Sao.common.IconFactory.prototype.get_icon_img = function(icon_name, attrs) {
    attrs = attrs || {};
    if (!attrs['class']) {
        attrs['class'] = 'icon';
    }

    var type = attrs.type || false;

  
    
    var img = jQuery('<img/>', attrs);
    if (icon_name) {
        this.get_icon_url(icon_name, type).then(function(url) {
            img.attr('src', url);
        });
    }
    return img;
};

////////////////END common.js ///////////

//tab.js

Sao.Tab.prototype.create_toolbar = function() {
   
    var toolbar = jQuery('<nav/>', {
        'class': 'toolbar navbar navbar-default',
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
    }).append('&times;')).click(function() {
        this.close();
    }.bind(this)))).append(jQuery('<div/>', {
        'class': 'btn-toolbar navbar-right flip',
        'role': 'toolbar'
    })));
    this.set_menu(toolbar.find('ul[role*="menu"]'));

    var group;
    var add_button = function(item) {
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
                'type':'toolbar_icons'
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
        this.buttons[item.id].click(item, function(event) {
            var item = event.data;
            var button = this.buttons[item.id];
            button.prop('disabled', true);
            (this[item.id](this) || jQuery.when())
                .always(function() {
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
        .addClass( 'hidden-xs')
        .find('.dropdown')
        .on('show.bs.dropdown', function() {
            jQuery(this).parents('.btn-group')
                .removeClass( 'hidden-xs');
        })
        .on('hide.bs.dropdown', function() {
            jQuery(this).parents('.btn-group')
                .addClass('hidden-xs');
        });
    return toolbar;
};

Sao.Tab.Form.prototype.create_toolbar = function() {
    var toolbar = Sao.Tab.Form._super.create_toolbar.call(this);
    var screen = this.screen;
    var buttons = this.buttons;
    var prm = screen.model.execute('view_toolbar_get', [],
        screen.context);
    prm.done(function(toolbars) {
        [
        ['action', 'tryton-launch',
            Sao.i18n.gettext('Launch action')],
        ['relate', 'tryton-link',
             Sao.i18n.gettext('Open related records')],
        ['print', 'tryton-print',
             Sao.i18n.gettext('Print report')]
        ].forEach(function(menu_action) {
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
                        'type':'toolbar_icons'
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
                .on('show.bs.dropdown', function() {
                    jQuery(this).parents('.btn-group').removeClass(
                            'hidden-xs');
                }).on('hide.bs.dropdown', function() {
                    jQuery(this).parents('.btn-group').addClass(
                            'hidden-xs');
                });
            var menu = button.find('.dropdown-menu');
            button.click(function() {
                menu.find([
                    '.' + menu_action[0] + '_button',
                    '.divider-button',
                    '.' + menu_action[0] + '_plugin',
                    '.divider-plugin'].join(',')).remove();
                var buttons = screen.get_buttons().filter(
                    function(button) {
                        return menu_action[0] == (
                            button.attributes.keyword || 'action');
                    });
                if (buttons.length) {
                    menu.append(jQuery('<li/>', {
                        'role': 'separator',
                        'class': 'divider divider-button',
                    }));
                }
                buttons.forEach(function(button) {
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
                    .click(function(evt) {
                        evt.preventDefault();
                        screen.button(button.attributes);
                    })
                .appendTo(menu);
                });

                var kw_plugins = [];
                Sao.Plugins.forEach(function(plugin) {
                    plugin.get_plugins(screen.model.name).forEach(
                        function(spec) {
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
                kw_plugins.forEach(function(plugin) {
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
                    .click(function(evt) {
                        evt.preventDefault();
                        var ids = screen.current_view.selected_records
                            .map(function(record) {
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

            toolbars[menu_action[0]].forEach(function(action) {
                var item = jQuery('<li/>', {
                    'role': 'presentation'
                })
                .append(jQuery('<a/>', {
                    'role': 'menuitem',
                    'href': '#',
                    'tabindex': -1
                }).append(action.name))
                .click(function(evt) {
                    evt.preventDefault();
                    var prm = jQuery.when();
                    if (this.screen.modified()) {
                        prm = this.save();
                    }
                    prm.then(function() {
                        var exec_action = jQuery.extend({}, action);
                        var record_id = null;
                        if (screen.current_record) {
                            record_id = screen.current_record.id;
                        }
                        var record_ids = screen.current_view
                        .selected_records.map(function(record) {
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
                toolbars.exports.forEach(function(export_) {
                    var item = jQuery('<li/>', {
                        'role': 'presentation',
                    })
                    .append(jQuery('<a/>', {
                        'role': 'menuitem',
                        'href': '#',
                        'tabindex': -1,
                    }).append(export_.name))
                    .click(function(evt) {
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

//Add react components unmount
Sao.Tab.prototype.close = function() {
    var tabs = jQuery('#tabs');
    var tablist = jQuery('#tablist');
    var tab = tablist.find('#nav-' + this.id);
    var content = tabs.find('#' + this.id);
    var react_tree = content.find('[id*="_addon"]');
    this.show();
    return this._close_allowed().then(function() {
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
        react_tree.each(function(i, element) {
           
            var deleted = Sao.KalenisAddons.Components.delete(element);
            
        });
    }.bind(this));
};


// Sao.js

Sao.user_menu = function(preferences) {
    jQuery('#user-preferences').empty();
    jQuery('#user-favorites').empty();
    jQuery('#user-logout').empty();
    jQuery('#user-preferences').append(jQuery('<a/>', {
        'href': '#',
        'title': preferences.status_bar,
    }).click(function(evt) {
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
        'type':'toolbar_icons'
    })).append(jQuery('<span/>', {
        'class': 'visible-xs',
    }).text(title)));
};



//window.js

Sao.Window.Form.prototype.init =function(screen, callback, kwargs) {
    kwargs = kwargs || {};
    this.screen = screen;
    this.callback = callback;
    this.many = kwargs.many || 0;
    this.domain = kwargs.domain || null;
    this.context = kwargs.context || null;
    this.save_current = kwargs.save_current;
    var title_prm = jQuery.when(kwargs.title || '');
    title_prm.then(function(title) {
        this.title = title;
    }.bind(this));
    
    this.prev_view = screen.current_view;
    this.screen.screen_container.alternate_view = true;
    this.info_bar = new Sao.Window.InfoBar();
    var view_type = kwargs.view_type || 'form';
    
    this.switch_prm = this.screen.switch_view(view_type)
        .done(function() {
            if (kwargs.new_ &&
                (this.screen.current_view.view_type == view_type)) {
                this.screen.new_(undefined, kwargs.rec_name);
            }
        }.bind(this));
    var dialog = new Sao.Dialog('', 'window-form', 'lg', false);
    this.el = dialog.modal;
    this.el.on('keydown', function(e) {
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
        }).append(button_text).click(function() {
            this.response('RESPONSE_CANCEL');
        }.bind(this)));
    }
    
    if (kwargs.new_ && this.many) {
        dialog.footer.append(jQuery('<button/>', {
            'class': 'btn btn-default',
            'type': 'button'
        }).append(Sao.i18n.gettext('New')).click(function() {
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
    dialog.content.submit(function(e) {
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
            'type':'toolbar_icons'
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
            'type':'toolbar_icons'
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
            'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
            'type':'toolbar_icons'
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
            'type':'toolbar_icons'
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
            'type':'toolbar_icons'
        })
        ).appendTo(buttons);
        this.but_undel.click(this.undelete.bind(this));
        this.but_undel.prop('disabled', !access['delete'] || readonly);
    
        this.screen.message_callback = this.record_label.bind(this);
    }
    
    var content = jQuery('<div/>').appendTo(dialog.body);
    
    dialog.body.append(this.info_bar.el);
    
    this.switch_prm.done(function() {
        if (this.screen.current_view.view_type != view_type) {
            this.destroy();
        } else {
            title_prm.done(dialog.add_title.bind(dialog));
            content.append(this.screen.screen_container.alternate_viewport);
            this.el.modal('show');
        }
    }.bind(this));
    this.el.on('shown.bs.modal', function(event) {
        this.screen.display().done(function() {
            this.screen.set_cursor();
        }.bind(this));
    }.bind(this));
    this.el.on('hidden.bs.modal', function(event) {
        jQuery(this).remove();
    });
    };



    // /view/form.js

    Sao.View.Form.One2Many.prototype.init =  function(view, attributes) {
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
                'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                buttons =  jQuery('<div/>', {
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
                    'type':'toolbar_icons'
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
                    'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                'type':'toolbar_icons'
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
                 field_type:'o2m',
                 field_name:this.el.attr('id'),
                 field_instance:this
            });
            this.screen.pre_validate = attributes.pre_validate == 1;

            this.screen.message_callback = this.record_label.bind(this);
            this.prm = this.screen.switch_view(modes[0]).done(function() {
                this.content.append(this.screen.screen_container.el);
            }.bind(this));

            // TODO key_press

            this.but_switch.prop('disabled', this.screen.number_of_views <= 0);
        };


Sao.View.Form.Many2Many.prototype.init = function(view, attributes) {
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

    var buttons = jQuery('<div/>', {
        'class': 'input-group-btn'
    }).appendTo(group);
    this.but_add = jQuery('<button/>', {
        'class': 'btn btn-default btn-sm',
        'type': 'button',
        'tabindex': -1,
        'aria-label': Sao.i18n.gettext("Add"),
        'title': Sao.i18n.gettext("Add"),
    }).append(Sao.common.ICONFACTORY.get_icon_img('tryton-add', {
        //kalenis added color
        'type':'toolbar_icons'
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
        'type':'toolbar_icons'
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
        field_name:this.el.attr('id'),
        field_type:'m2m',
        field_instance:this
    });
    this.screen.message_callback = this.record_label.bind(this);
    this.prm = this.screen.switch_view('tree').done(function() {
        this.content.append(this.screen.screen_container.el);
    }.bind(this));
};

// END /view/form.js


// view.js

Sao.View.parse = function(screen, view_id, type, xml, children_field) {
    //kalenis
    switch (type) {
        case 'tree':{
            if(children_field === null){
                return new Sao.View.KalenisTree(view_id, screen, xml, children_field);
                // return new Sao.View.Tree(view_id, screen, xml, children_field);
            }
            else{
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

Sao.Record.prototype.loadRange = function(name, view_limit, force_eager, grid_fields, prefixes, extra_fields) {
            
    var prm;

    if ((this.id < 0) || (name in this._loaded) && !grid_fields) {
       
        return jQuery.when();
    }
  

    //Temporary comment
    // if (this.group.prm.state() == 'pending') {
    //     return this.group.prm.then(function() {
    //         console.log("Estoy haciendo un #recall desde MODEL");
    //         return this.loadRange(name, view_limit, force_eager, grid_fields, prefixes);
    //     }.bind(this));
    // }
   

    var id2record = {};
    id2record[this.id] = this;
    var loading;
    
    if(force_eager){
        loading = 'eager';
    }

   

  
    var fnames = [];
    var rec_named_fields = ['many2one', 'one2one', 'reference'];

   
    grid_fields.map(function(field){
        // if (!(field.attributes.name in this._loaded) ) {
        if(field.type === "field"){
            fnames.push(field.attributes.name);
            // }
            if(~(rec_named_fields.indexOf(field.field.description.type))){
                fnames.push(field.attributes.name+'.rec_name');
            }
        }
         

    }.bind(this));
    
    // if (!~fnames.indexOf('rec_name')) {
    //     fnames_to_fetch.push('rec_name');
    // }
    fnames.push('_timestamp');
   
    if(prefixes && prefixes.length > 0){
      
        prefixes.map(function(pref){
            fnames.push(pref);
        });
    }

    if(extra_fields && extra_fields.length>0){
        extra_fields.map(function(field){
            fnames.push(field);
        });
    }
    


    var context = jQuery.extend({}, this.get_context());
    
        

        //Kalenis
        var limit;
        if(view_limit){
            limit = parseInt((view_limit), 10);
            
        }
        // else{
        //     limit = parseInt(Sao.config.limit / fnames_to_fetch.length,
        //             10);  
        // }

      
        

        
        
        var filter_group = function(record) {
            
            var to_load = grid_fields.length;
            var loaded = Object.keys(record._loaded).length;
            
            return true;
            // return !(name in record._loaded) && (record.id >= 0);
        };
        var filter_parent_group = function(record) {
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
            var slicedGroup = group.slice(idx, idx+limit);
            

            slicedGroup.map(function(record){
                n++;
                if(record.id > 0){
                    id2record[record.id] = record;
                }
                
            });
            
           
        }
    

   
    
    prm = this.model.execute('read', [Object.keys(id2record).map(
                function (e) { return parseInt(e, 10); }),
            fnames], context);
    var succeed = function(values, exception) {
        if (exception === undefined) exception = false;
        var id2value = {};
        var promises = [];
        values.forEach(function(e, i, a) {
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
    var failed = function() {
       
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

Sao.Record.prototype.set_on_change = function(values) {
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
            var rec_name = fieldname+'.rec_name';
            
           
            // this._values[related] = values[related] || {};
            this._values[related] = {id:values[fieldname],rec_name:values[rec_name]};
           
            
            
        }
        
        this.model.fields[fieldname].set_on_change(this, value);
    }
};

// END model.js


// screen.js

Sao.Screen.prototype.init = function(model_name, attributes) {
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
                    'context': attributes.context });

        this.context_screen_prm = this.context_screen.switch_view()
            .then(function() {
                jQuery('<div/>', {
                    'class': 'row'
                }).append(jQuery('<div/>', {
                    'class': 'col-md-12'
                }).append(this.context_screen.screen_container.el))
                .prependTo(this.screen_container.filter_box);
                return this.context_screen.new_(false).then(function(record) {
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

Sao.Screen.prototype.switch_view = function(view_type, view_id) {
    if ((view_id !== undefined) && (view_id !== null)) {
        view_id = Number(view_id);
    } else {
        view_id = null;
    }
    if (this.current_view) {
        //kalenis: Delete all react component instances when switch views
        

        switch(this.current_view.view_type){
            case 'tree':{
                if(this.current_view.view_context === 'list_view'){
                    var deleted = Sao.KalenisAddons.Components.delete(this.current_view.el[0]);
                 
                    
                }
                break;
                
            }
            case 'form':{
                
                var react_fields = jQuery(this.current_view.el[0]).find('[id*="_addon"]');
                // var react_fields = this.current_view.el[0].find('[id*="_addon"]');
                react_fields.each(function(i, element) {
                   
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
            return this.current_view.display().done(function() {
                this.set_cursor();
            }.bind(this));
        }
    }
    var found = function() {
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
    var _switch = function() {
        var set_container = function() {
            this.screen_container.set(this.current_view.el);
            return this.display().done(function() {
                this.set_cursor();
                if (this.switch_callback) {
                    this.switch_callback();
                }
            }.bind(this));
        }.bind(this);
        var continue_loop = function() {
            if (!view_type && (view_id === null)) {
                return false;
            }
            if (view_type && !view_id && !this.view_to_load.length) {
                return false;
            }
            return true;
        }.bind(this);
        var set_current_view = function() {
            this.current_view = this.views[this.views.length - 1];
        }.bind(this);
        var switch_current_view = (function() {
            set_current_view();
            if (continue_loop()) {
                return _switch();
            } else {
                return set_container();
            }
        }.bind(this));
        var is_view_id = function(view) {
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

//END screen.js


//window.js

Sao.Window.Preferences = Sao.class_(Object, {
    init: function(callback) {
        this.callback = callback;
        var dialog = new Sao.Dialog('Preferences', '', 'lg');
        this.el = dialog.modal;

        jQuery('<button/>', {
            'class': 'btn btn-link',
            'type': 'button'
        }).append(Sao.i18n.gettext('Cancel')).click(function() {
            this.response('RESPONSE_CANCEL');
        }.bind(this)).appendTo(dialog.footer);
        jQuery('<button/>', {
            'class': 'btn btn-primary',
            'type': 'submit'
        }).append(Sao.i18n.gettext('OK')).appendTo(dialog.footer);
        dialog.content.submit(function(e) {
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

        var set_view = function(view) {
            this.screen.add_view(view);
            this.screen.switch_view().done(function() {
                this.screen.new_(false);
              

                this.screen.model.execute('get_preferences', [false], {})
                .then(set_preferences.bind(this), this.destroy);
            }.bind(this));
        };

        //KALENIS:Modified, Pending make a diff with dev branch
        var set_preferences = function(preferences) {
           
            var prm;
            this.screen.current_record.cancel();
            this.screen.current_record.set(preferences);
            this.screen.current_record.id =
            this.screen.model.session.user_id;
            
            // prm.then(function() {
               
                this.screen.current_record.validate(null, true).then(
                    function() {
                       
                        this.screen.display(true);
                    }.bind(this));
            // }.bind(this));
            dialog.body.append(this.screen.screen_container.el);
            
            this.el.modal('show');
        };
        this.el.on('hidden.bs.modal', function(event) {
            jQuery(this).remove();
        });

        this.screen.model.execute('get_preferences_fields_view', [], {})
            .then(set_view.bind(this), this.destroy);
    },
    response: function(response_id) {
        var end = function() {
            this.destroy();
            this.callback();
        }.bind(this);
        var prm = jQuery.when();
        if (response_id == 'RESPONSE_OK') {
            prm = this.screen.current_record.validate()
                .then(function(validate) {
                    if (validate) {
                        var values = jQuery.extend({}, this.screen.get());
                        return this.screen.model.execute(
                            'set_preferences', [values], {});
                    }
                }.bind(this));
        }
        prm.done(end);
    },
    destroy: function() {
        this.el.modal('hide');
    }
});
// End window .js
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

        if (this.screen.tab) {
            this.el.attr('id', this.screen.tab.id + '_addon');
        }
        else if (this.field_name) {
            this.el.attr('id', this.field_name + '_addon');
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

        this.screen.group.map(function (record) {
            group.push(record);
        });

        
        
        Sao.KalenisAddons.Components.createTreeView({ element: this.el[0], sao_props: { screen: this.screen, columns: this.columns, group: group,  field_name: this.field_name,field_instance:this.field_instance || null, view_context:this.view_context, session:Sao.Session.current_session } });

        
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

export default Sao;

