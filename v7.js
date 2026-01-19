Sao.common.ViewSearch.prototype.load_searches = function() {
    this.searches = {};
    return Sao.rpc({
        'method': 'model.ir.ui.view_search.get',
        'params': [{}]
    }, Sao.Session.current_session).then(function(searches) {
        this.searches = searches;
    }.bind(this));
};

Sao.common.ViewSearch.prototype.add = function(model, name, domain) {
    return Sao.rpc({
        'method': 'model.ir.ui.view_search.set',
        'params': [name, model, this.encoder.encode(domain), {}],
    }, Sao.Session.current_session).then(function(id) {
        if (this.searches[model] === undefined) {
            this.searches[model] = [];
        }
        this.searches[model].push([id, name, domain, true]);
    }.bind(this));
};

Sao.common.ViewSearch.prototype.remove = function(model, id) {
    return Sao.rpc({
        'method': 'model.ir.ui.view_search.unset',
        'params': [id, {}]
    }, Sao.Session.current_session).then(function() {
        for (var i = 0; i < this.searches[model].length; i++) {
            var domain = this.searches[model][i];
            if (domain[0] === id) {
                this.searches[model].splice(i, 1);
                break;
            }
        }
    }.bind(this));
};

Sao.field.Float.prototype.digits = function(record, factor) {
    if (factor === undefined) {
        factor = 1;
    }
    var digits = record.expr_eval(this.description.digits);
    if (typeof(digits) == 'string') {
        if (!(digits in record.model.fields)) {
            return;
        }
        var digits_field = record.model.fields[digits];
        var digits_name = digits_field.description.relation;
        var digits_id = digits_field.get(record);
        if (digits_name && (digits_id !== null) && (digits_id >= 0) && this._digits) {
            if (digits_id in this._digits) {
                digits = this._digits[digits_id];
            } else {
                try {
                    digits = Sao.rpc({
                        'method': 'model.' + digits_name + '.get_digits',
                        'params': [digits_id, {}],
                    }, record.model.session, false);
                } catch(e) {
                    Sao.Logger.warn(
                        "Fail to fetch digits for %s,%s",
                        digits_name, digits_id);
                    return;
                }
                this._digits[digits_id] = digits;
            }
        } else {
            return;
        }
    }
    if (!digits || !digits.every(function(e) {
        return e !== null;
    })) {
        return;
    }
    var shift = Math.round(Math.log(Math.abs(factor)) / Math.LN10);
    return [digits[0] + shift, digits[1] - shift];
};

// Sao.Record.prototype.on_change =  function(fieldnames) {
//     var values = {};
//     fieldnames.forEach(function(fieldname) {
//         var on_change = this.model.fields[fieldname]
//         .description.on_change;
//         if (!jQuery.isEmptyObject(on_change)) {
//             values = jQuery.extend(values,
//                 this._get_on_change_args(on_change));
//         }
//     }.bind(this));
//     if (!jQuery.isEmptyObject(values)) {
//         var changes;
//         try {
//             if ((fieldnames.length == 1) ||
//                 (values.id === undefined)) {
//                 changes = [];
//                 fieldnames.forEach(function(fieldname) {
//                     changes.push(this.model.execute(
//                         'on_change_' + fieldname,
//                         [values], this.get_context(), false));
//                 }.bind(this));
//             } else {
//                 changes = [this.model.execute(
//                     'on_change',
//                     [values, fieldnames], this.get_context(), false)];
//             }
//         } catch (e) {
//             return;
//         }

        
//         if(changes.length > 0) {
//             console.log("CHANGES ON ON CHANGE (INHERITED):");
//             console.log(changes);
//             changes.forEach(this.set_on_change, this);
//         }
        
//     }
// };

Sao.Record.prototype.on_change = function(fieldnames) {
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
        var changes = [];
        try {
            if (fieldnames.length == 1) {
                // changes = [];
                changes.push(this.model.execute(
                    'on_change_' + fieldnames[0],
                    [values], this.get_context(), false));
            } else {
                changes = [this.model.execute(
                    'on_change',
                    [values, fieldnames], this.get_context(), false)];
            }
        } catch (e) {
            return;
        }
        
        if(!jQuery.isEmptyObject(changes)){
            changes.forEach(function(change) {
                
                if(!jQuery.isEmptyObject(change)){
                   this.set_on_change(change);
                }
            }.bind(this));
        }
        
        // changes.forEach(this.set_on_change, this);
    }
};

Sao.Record.prototype.on_change_with = function(field_names) {
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
            this._get_on_change_args(
                on_change_with.concat([fieldname])));
        if ((this.model.fields[fieldname] instanceof
                    Sao.field.Many2One) ||
                (this.model.fields[fieldname] instanceof
                 Sao.field.Reference)) {
            delete this._values[fieldname + '.'];
        }
    }
    var changed;
    fieldnames = Object.keys(fieldnames);
    if (fieldnames.length) {
        try {
            if ((fieldnames.length == 1 &&  
                this.model.name != 'lims.interface.data' && 
                this.model.name != 'lims.interface.grouped_data') ||
                (values.id === undefined)) {
                changed = {};
                fieldnames.forEach(function(fieldname) {
                    changed = jQuery.extend(
                        changed,
                        this.model.execute(
                            'on_change_with_' + fieldname,
                            [values], this.get_context(), false));
                }.bind(this));
            } else {
                changed = this.model.execute(
                    'on_change_with',
                    [values, fieldnames], this.get_context(), false);
                console.log("CHANGED ON ON CHANGE WITH: LINE 220", JSON.stringify(changed));
            }
        } catch (e) {
            return;
        }
        this.set_on_change(changed);
    }
    if (!jQuery.isEmptyObject(later)) {
        values = {};
        Object.keys(later).forEach(function(fieldname) {
            on_change_with = this.model.fields[fieldname]
                .description.on_change_with;
            values = jQuery.extend(
                values,
                this._get_on_change_args(
                    on_change_with.concat([fieldname])));
        }.bind(this));
        fieldnames = Object.keys(later);
        try {
            if ((fieldnames.length == 1) ||
                (values.id === undefined)) {
                changed = {};
                fieldnames.forEach(function(fieldname) {
                    changed = jQuery.extend(
                        changed,
                        this.model.execute(
                            'on_change_with_' + fieldname,
                            [values], this.get_context(), false));
                }.bind(this));
            } else {
                changed = this.model.execute(
                    'on_change_with',
                    [values, fieldnames], this.get_context(), false);
            }
        } catch (e) {
            return;
        }
        this.set_on_change(changed);
       
    }
    console.log("CHANGED ON ON CHANGE WITH:", changed);
    console.log("RECORD AFTER ON CHANGE WITH:", this._values);
};

Sao.View.Form.Text.prototype.display = function() {
    Sao.View.Form.Text._super.display.call(this);
    var record = this.record;
    if (record) {
        var value = record.field_get_client(this.field_name);
        this.input.val(value);
        if(this.attributes.spell) {
            if(typeof(record.expr_eval(this.attributes.spell)) == 'string') {
            this.input.attr('lang',
                    Sao.i18n.BC47(record.expr_eval(this.attributes.spell)));
            this.input.attr('spellcheck', 'true');
            }
            
        }
    } else {
        this.input.val('');
    }
};

Sao.Window.Export.prototype.addreplace_predef = function() {
    var fields = [];
    console.log("ADD REPLACE EXPORT INHERITED !");
    var selected_fields = this.fields_selected.children('li');
    for(var i=0; i<selected_fields.length; i++) {
        fields.push(selected_fields[i].getAttribute('path'));
    }
    if(fields.length === 0) {
        return;
    }
    var pref_id;

    var save = function(name) {
        var prm;
        var values = {
            'header': this.el_add_field_names.is(':checked'),
            'records': (
                JSON.parse(this.selected_records.val()) ?
                'selected' : 'listed'),
        };
        if (!pref_id) {
            values.name = name;
            values.resource = this.screen.model_name;
            values.export_fields = fields.map(function(f) { return {'name': f}; });
            prm = Sao.rpc({
                method: 'model.ir.export.set',
                params: [values, this.context],
            }, this.session);
        } else {
            prm = Sao.rpc({
                method: 'model.ir.export.update',
                params: [pref_id, values, fields, this.context],
            }, this.session).then(function() { return pref_id; });
        }
        return prm.then(function(pref_id) {
            this.session.cache.clear(
                'model.' + this.screen.model_name + '.view_toolbar_get');
            this.predef_exports[pref_id] = {
                'fields': fields,
                'values': values,
            };
            if (selection.length === 0) {
                this.add_to_predef(pref_id, name);
            }
        }.bind(this));
    }.bind(this);

    var selection = this.predef_exports_list.children('li.bg-primary');
    if (selection.length === 0) {
        pref_id = null;
        Sao.common.ask.run(
            Sao.i18n.gettext('What is the name of this export?'),
            'export')
        .then(save);
    }
    else {
        pref_id = selection.attr('export_id');
        Sao.common.sur.run(
            Sao.i18n.gettext(
                'Override %1 definition?', selection.text()))
        .then(save);
    }
};

Sao.common.selection_mixin.update_selection = function(record, field,
    callback) {
    var _update_selection = function() {
        if (!field) {
            if (callback) {
                callback(this.selection, this.help);
            }
            return;
        }
        
        var domain = [];
        try{
            domain = field.get_domain(record);
        }catch(e){
          console.log("-");
        }
        
        if (!('relation' in this.attributes)) {
            var change_with = this.attributes.selection_change_with || [];
            var value = record._get_on_change_args(change_with);
            delete value.id;
            Sao.common.selection_mixin.init_selection.call(this, value,
                    function() {
                        Sao.common.selection_mixin.filter_selection.call(
                                this, domain, record, field);
                        if (callback) {
                            callback(this.selection, this.help);
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
                    callback(this.selection, this.help);
                }
                return;
            }
            var fields = ['rec_name'];
            var help_field = this.attributes.help_field;
            if (help_field) {
                fields.push(help_field);
            }
            var prm = Sao.rpc({
                'method': 'model.' + this.attributes.relation +
                    '.search_read',
                'params': [domain, 0, null, null, fields, context]
            }, record.model.session);
            prm.done(function(result) {
                var selection = [];
                result.forEach(function(x) {
                    selection.push([x.id, x.rec_name]);
                });
                if (this.nullable_widget) {
                    selection.push([null, '']);
                }
                var help = {};
                if (help_field){
                    result.forEach(function(x) {
                        help[x.id] = x[help_field];
                    });
                }
                this._last_domain = [domain, context];
                this._domain_cache[jdomain] = selection;
                this.selection = jQuery.extend([], selection);
                this.help = help;
                if (callback) {
                    callback(this.selection, this.help);
                }
            }.bind(this));
            prm.fail(function() {
                this._last_domain = null;
                this.selection = [];
                if (callback) {
                    callback(this.selection, this.help);
                }
            }.bind(this));
        }
    };
    this._selection_prm.done(_update_selection.bind(this));
};

Sao.Wizard.prototype.process = function() {
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
                    // Kalenis: Merge defaults and values before displaying the screen(new in 7.0)
                    var vals = jQuery.extend({}, view.defaults, view.values || {});
                    this.screen.current_record.set_default(vals);
                    
                    this.update_buttons();
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
                        Sao.Action.execute(
                            action[0], action[1], context);
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
};