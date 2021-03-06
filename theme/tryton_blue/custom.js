Sao.config.icon_colors = {
    'toolbar_icons':'white',
    'default':'#3465a4',
    // 'default':'#1565c0'
  
};

Sao.config.bug_url = 'https://bugs.tryton.org/';
Sao.config.title = 'Tryton';


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
               
                // Sao.common.ICONFACTORY.get_icon_url('tryton-menu','toolbar_icons')
                //     .then(function(url) {
                //         jQuery('.navbar-brand > img').attr('src', url);
                //     });
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