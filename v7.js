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

// Sao.Field.One2Many.prototype.get_on_change_value = function(record) {
//     var result = [];
//     var group = record._values[this.name];
//     if (group === undefined) return result;
//     for (var i = 0, len = record._values[this.name].length; i < len;
//             i++) {
//         var record2 = group[i];
//         if (!record2.deleted && !record2.removed)
//             result.push(record2.get_on_change_value(
//                         [this.description.relation_field || '']));
//     }
//     return result;
// };



// Sao.Field.One2Many.prototype._set_default_value =  function(record, model) {
//     console.log("RUNNING INHERITED SET DEFAULT VALUE o2m");
//     if (record._values[this.name] !== undefined) {
//         return;
//     }
//     if (!model) {
//         model = new Sao.Model(this.description.relation);
//     }
//     if (record.model.name == this.description.relation) {
//         model = record.model;
//     }
//     var group = Sao.Group(model, {}, []);
//     group.set_parent(record);
//     group.parent_name = this.description.relation_field;
//     group.child_name = this.name;
//     group.parent_datetime_field = this.description.datetime_field;
//     record._values[this.name] = group;
// };