import React from 'react';
import ReactDOM from 'react-dom';
// import App from './App';
import moment from 'moment';
import renderer from 'react-test-renderer';
// require('./sao.js');

import TreeView from '../TreeView'

//NOTE: tryton-sao5.2js its a copy of tryton-sao.js, adding a default export to simplify testing.

window.i18n = function () {
  return {
    gettext: function (value) { return "Translated Text" }
  }
}
window.moment = require('../../../sao/bower_components/moment/min/moment.min.js')
window.jQuery = require('../../../sao/bower_components/jquery/dist/jquery.min.js')
window.bootstrap = require('../../../sao/bower_components/bootstrap/dist/js/bootstrap.min.js')
window.locales = require('../../../sao/bower_components/moment/min/locales.min.js')
window.gettext = require('../../../sao/bower_components/gettext.js/dist/gettext.min.js')
window.d3 = require('../../../sao/bower_components/d3/d3.min.js')
window.papaparse = require('../../../sao/bower_components/papaparse/papaparse.min.js')
// window.fullcalendar = require('../../../sao/bower_components/fullcalendar/dist/fullcalendar.min.js')
// window.locale_all = require('../../../sao/bower_components/fullcalendar/dist/locale-all.js')
window.mousetrap = require('../../../sao/bower_components/mousetrap/mousetrap.min.js')




beforeAll(() => {
  async function getSao() {
   

    let SaoImport = await import('./tryton-sao5.2.js')
    let Sao = SaoImport.default

    //Grant Access to test.model
    Sao.common.ModelAccess.prototype.get = function (model_name) {
      
      return true;
    }

    Object.defineProperty(window, 'Sao', {

      // get: jest.fn().mockImplementation(() => { return Sao; }),
      get: () => { return Sao },
      set: jest.fn().mockImplementation(() => { }),

    });




  }



  return getSao()
});






const testing_time = moment('12-10-1985-09:18:21', "MM-DD-YYYY-HH:mm:ss")


const widgets = [
  ['char', 'kalenis_testing_char'],
  ['numeric', 320.8],
  ['boolean', true],
  ['date', moment('12-10-1985', "MM-DD-YYYY" )],
  ['datetime', moment('12-10-1985-09:18:21',"MM-DD-YYYY-HH:mm:ss")],
  ['time', testing_time],
  ['text', 'Kalenis testing TextColumn'],
  ['integer', 1],
  ['float', 0.8],
  ['timedelta', '8h'],
  ['many2one', 1],
  ['selection', 'test_kalenis'],
  ['one2many', [1,2,15,12]],
  ['many2many', [1,2,15,12,90]],
  ['reference', ['test.model', 1]],
  ['url',"tryton.org"],
  // TODO:'binary',

]


const selection_test_options = [
  ['test_kalenis', 'Sucess Selection Field'],
  ['done', 'Done'],
  ['cancel', 'Cancel']
]

const reference_test_options = [
  ['test.model', 'Test Model'],
  ['party.party', 'Party'],
  ['account.invoice', 'Invoices']
]




widgets.map(function (widget) {
  var column_name = widget[0].concat('_column')



  test('render readonly Tree View_'.concat(widget[0]), () => {


    // var props = createProps(widget)

    var props = createProps(widget)


    const readonlyTree = renderer
      .create(<TreeView sao_props={props} element_id="test_01" />)
      .toJSON();
    expect(readonlyTree).toMatchSnapshot();
  });


})



function createProps(widget) {


  var Screen = createScreen(widget)
  var columns = createColumn(widget[0], Screen)

  var sao_props = {

    columns: columns,
    field_instance: {},
    field_name: "",
    // group:getGroup(column_name, widget[1], widget[0]),
    group: Screen.group,
    screen: Screen,
    session: Screen.group.model.session,
    view_context: "list_view"
  }


  return sao_props

}

function createField(widget, name, params) {


  var description = {}

  if (params) {
    description = params
  }
  else {
    description.name = name ? name : widget[1]
  }

  switch (widget[0]) {
    case 'time': {
      description.format = "\"%H:%M:%S\""
    }

    case 'selection': {
      description.selection = selection_test_options

    }

    case 'reference':{
      description.selection =  reference_test_options;
    }
  }

  var field_type = Sao.field.get(widget[0])
  var field = new field_type(description)



  return field

}


function createScreen(widget) {

  var fields = []
  var column_name = widget[0].concat('_column')

  var attrs = {}

  var screen = new Sao.Screen(
    'test.model', attrs
  )

  var field = createField(widget, column_name, {
    autocomplete: [],
    context: "{}",
    create: true,
    delete: true,
    domain: "[]",
    help: "test Help",
    loading: "eager",
    name: column_name,
    on_change: [],
    on_change_with: [],
    readonly: false,
    required: true,
    searchable: true,
    sortable: true,
    states: "",
    string: column_name,
    translate: false,
    type: widget
  })

  fields.push(field)
  screen.model.fields = fields

  screen.current_view = {
    editable: false,
    set_selected_records: function () { return true }
  }

  screen.group.load([1, 2], false)


  if (widget[0] === 'many2one' || widget[0] === 'reference') {
    var rec_column = column_name.concat('.')

    screen.group[0]._values[rec_column] = { id: createValue(widget, false, screen), rec_name: "Sucess_".concat(widget[0]).concat("_Field Rec Name") }

  }

  screen.group[0]._values[column_name] = createValue(widget, false, screen)
  screen.group[1]._values[column_name] = createValue(widget, true, screen)

  var session = {
    database: 'kalenis_testing',
    get_auth: function () { return true },
    context: {}

  }
  screen.group.model.session = session


  return screen

}

function createValue(widget, empty, screen) {

  switch (widget[0]) {
    case 'boolean': {
      if (!empty) {
        return true
      }
      else {
        return false
      }
    }
    case 'timedelta': {
      if (!empty) {
        return window.Sao.TimeDelta(null, '3600')
      }
      else {
        return null
      }
    }
    case 'one2many': {
      if (!empty) {
        return widget[1]
      }
      else {
        return []
      }
    }
    case 'many2many': {
      if (!empty) {
        return widget[1]
      }
      else {
        return []
      }
    }
    default: {
      if (!empty) {
        return widget[1]
      }
      else {
        return null
      }
    }


  }
}



function createColumn(widget, screen) {
  var columns = []
  var column_name = widget.concat('_column')
 
  var model_name = "test.model"
  var column =
  {
    attributes: {
      context: "{}",
      create: true,
      delete: true,
      domain: "[]",
      help: "Test Help",
      name: column_name,
      states: "",
      string: column_name,
      translate: false,
      widget: widget,
      width: 65

    },
    field: screen.model.fields[0],


    footers: [],
    header: null,
    model: {
      name: model_name,
      fields: {}
    },
    prefixes: [],
    sortable: true,
    suffixes: [],
    type: 'field',

    // TODO:type:'button?'

  }

  


  columns.push(column)


  return columns

}



