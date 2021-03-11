import React, { PureComponent } from 'react';


import VListView from './VListView.js';
import ColumnManager from './ColumnManager.js';
import TabDomain from './TabDomain.js';
import ws from '../common/ws.js';
import Portal from '../common/Portal.js'
import ViewManager from './ViewManager';

// const currentSession = window.Sao.Session.current_session

const columnManagerColors = {
  regular: "rgb(37,106,167)",
  warning: 'red'
}
const common_filter_fields =
  [
    ['id', window.Sao.i18n.gettext('ID'), 'integer'],
    ['create_uid', window.Sao.i18n.gettext('Created by'), 'many2one'],
    ['create_date', window.Sao.i18n.gettext('Created at'), 'datetime'],
    ['write_uid', window.Sao.i18n.gettext('Modified by'), 'many2one'],
    ['write_date', window.Sao.i18n.gettext('Modified at'), 'datetime']
  ]

const DEFAULT_VIEW = { 'id': 0, 'rec_name': 'Base View' }
class TreeView extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      model: this.props.sao_props.screen.model_name,
      fields: false,
      hidden_columns: false,
      actions: {

        modelActions: {
          action: [],
          relate: [],
          print: []
        },
        relationActions: []
      },


      open_order_modal: false,
      prefixes: [],
      show_footer: false,
      unique_columns: [],
      visibleFields: [],
      tab_domain: false,
      user_views: [],
      current_view: false,
      current_view_modified: false,
      list_style: {},
      
    }

    this.setColumns = this.setColumns.bind(this)
    this.createActions = this.createActions.bind(this);
    this.getModelActions = this.getModelActions.bind(this);
    this.getRelationActions = this.getRelationActions.bind(this);
    this.onSortColumnsEnd = this.onSortColumnsEnd.bind(this);
    this.onCloseModal = this.onCloseModal.bind(this);
    this.onOpenModal = this.onOpenModal.bind(this);
    this.updateColumn = this.updateColumn.bind(this);
    this.setHiddenColumnsStatus = this.setHiddenColumnsStatus
    this.getStateAttrFields = this.getStateAttrFields.bind(this);
    //View Manager Methods
    this.getUserViews = this.getUserViews.bind(this);
    this.getUserViewFields = this.getUserViewFields.bind(this);
    this.changeView = this.changeView.bind(this);
    this.setCurrentModified = this.setCurrentModified.bind(this);
    this.saveView = this.saveView.bind(this);
    this.deleteViews = this.deleteViews.bind(this);
    this.updateViews = this.updateViews.bind(this);
    this.switchViewMode = this.switchViewMode.bind(this);
    this.getListStyle = this.getListStyle.bind(this);
    this.discardViewChanges = this.discardViewChanges.bind(this);
    this.getFilterFields = this.getFilterFields.bind(this);
    this.changeViewLimit = this.changeViewLimit.bind(this);



  }



  componentDidMount() {



    // let t0 = performance.now()
    const type = this.props.sao_props.screen.current_view.view_context
    if (!this.props.sao_props.screen.disable_view_manager 
          && type === 'list_view'
          || type === 'o2m') {
      this.getUserViews()

    }
    
    
    else {
      this.setColumns(false)
      this.setState({
        current_view: DEFAULT_VIEW
      })
    }



    if (this.props.sao_props.screen.screen_container.tab_domain.length > 0) {
      this.setState({ tab_domain: true })
    }


    if (window.$) {
      

      if (type === 'list_view') {
        let el = document.createElement('span')
        let el_id = this.props.element_id + "_user_view_list"
        el.id = el_id
        el.className = "form-control"
        el.style = "padding-left:0px;padding-right:0px;margin-left:2%;max-width:100%;display:flex;background:transparent;border:none;box-shadow:none;padding-top:0px;padding-bottom:0px"
        this.props.sao_props.screen.screen_container.but_bookmark.parent().parent().append(el)
      }
      else if (type === "o2m") {
        let el = document.createElement('button')
        let el_id = this.props.element_id + "_user_view_list"
        el.id = el_id
        el.type = 'button'
        el.className = "btn btn-default btn-sm"
        el.style = "background:transparent;border:none;box-shadow:none;margin:0px;padding:0px;max-width:35px;"
        this.props.sao_props.field_instance.but_switch.parent().prepend(el);
      }






    }




  }



  setHiddenColumnsStatus() {


    let hidden_columns = this.state.fields.length > this.state.visibleFields.length
    if (hidden_columns != this.state.hidden_columns) {

      const columns_manager_id = '#' + this.props.element_id + "_sortcolumns"

      if (hidden_columns) {

        window.$(columns_manager_id).css("color", columnManagerColors['warning'])
        window.$(columns_manager_id).append("<sup id=" + this.props.element_id.concat('hidden_columns') + ">*</sup>")

      }
      else {
        window.$(columns_manager_id).css("color", columnManagerColors['regular'])

        window.$("#" + this.props.element_id.concat('hidden_columns')).remove()
      }
      if (window.$(columns_manager_id).length) {
        this.setState({ hidden_columns: hidden_columns })
      }

    }


  }

  getFilterFields() {
    let filter_fields = {}
    this.state.visibleFields.forEach(function (col) {
      if (col.type === "field") {
        filter_fields[col.attributes.name] = col.field.description
      }

    })

    //Add tree invisible fields
    
    this.props.sao_props.columns.forEach(function(col){

      if(col.type === 'field' && this.state.extra_fields.includes(col.attributes.name)){
        filter_fields[col.attributes.name] = col.field.description
      }
      
    }.bind(this))
    common_filter_fields.forEach(function (e) {
      var name = e[0];
      var string = e[1];
      var type = e[2];
      if (!(name in filter_fields)) {
        filter_fields[name] = {
          'string': string,
          'name': name,
          'type': type
        };
        if (type == 'datetime') {
          filter_fields[name].format = '"%H:%M:%S"';
        }
      }
    });

    return filter_fields


  }
  componentDidUpdate(prevProps, prevState) {


    this.setHiddenColumnsStatus()


    if (JSON.stringify(this.props.sao_props.domain) != JSON.stringify(prevProps.sao_props.domain)) {

      this.updateColumnsDomain(this.props.sao_props.domain)

    }
    if (prevState.visibleFields !== this.state.visibleFields) {

      let filter_fields = this.getFilterFields()
      this.props.sao_props.screen.domain_parser.fields = {};
      this.props.sao_props.screen.screen_container.search_modal = false;
      let domain_parser = this.props.sao_props.screen.domain_parser()
      domain_parser.update_fields(filter_fields)
      
    }


    if (this.props.sao_props.view_context === "m2m") {
      if (this.props.sao_props.group.length !== prevProps.sao_props.group.length) {
        const counter_id = '#' + this.props.sao_props.field_name + "_counter"

        window.$(counter_id).text(this.props.sao_props.group.length)
      }

    }


  }



  updateColumnsDomain(domain) {
    let columns = [...this.state.visibleFields]
    let update = false;
    let uniques = []
    let unique_column = false;
    var inversion = new window.Sao.common.DomainInversion();

    columns.map(function (column) {

      if (column.attributes) {
        var inv_domain = inversion.domain_inversion(domain, column.attributes.name);
        if (typeof inv_domain != 'boolean') {
          inv_domain = inversion.simplify(inv_domain);
        }

        let unique = inversion.unique_value(inv_domain)[0];
        if (unique) {

          update = true;
          column.unique = true;
          unique_column = true;
          uniques.push(column.attributes.name)
        }


      }

    }.bind(this))

    if (unique_column === false) {

      this.state.unique_columns.map(function (column_name) {
        var inv_domain = inversion.domain_inversion(domain, column_name);
        if (typeof inv_domain != 'boolean') {
          inv_domain = inversion.simplify(inv_domain);
        }
        unique_column = inversion.unique_value(inv_domain)[0];
      })

    }

    if (update === false && unique_column === false) {
      this.state.unique_columns.map(function (unique) {
        let recovered_column = this.state.fields.filter(function (column) { if (column.attributes) { return column.attributes.name === unique } })[0]



        recovered_column.unique = false;
        columns.push(recovered_column)
        update = true
      }.bind(this))

      uniques = [];

    }

    if (update) {

      columns = columns.filter(function (column) { return !column.unique })
      this.setState({
        visibleFields: columns,
        unique_columns: uniques
      })
    }

  }

  //TODO: Refactor
  getStateAttrFields(col) {
    
    let decoder = new window.Sao.PYSON.Decoder({}, true);
    let states_decoded;
    let skip = false;
    try {
      states_decoded = decoder.decode(col.attributes.states)
    }
    catch (e) {
      skip = true
    }

    if (!skip) {

      function getValue(obj) {


        if (!obj) {
          return
        }
        if (Array.isArray(obj)) {
          return obj
        }

        if (obj.hasOwnProperty('_value')) {
          if (typeof (obj._value) === 'string') {

            return obj._value
          }
          else {
            return getValue(obj._value)
          }

        }
        else {
          if (obj && typeof obj === 'object') {
            return obj.__string_params__().map(function (sub_obj) {

              return getValue(sub_obj)
            })
          }
        }

      }

      // let fieldMap = []
      let fields = []
      Object.values(states_decoded).forEach(function (st) {
        
        if (st && typeof st != 'boolean' && !Array.isArray(st)) {
          if(st.__string_params__){
            
            let args = st.__string_params__()
            fields = args.map(function (arg) {
              
  
              let value = getValue(arg)
  
              return value;
            })
          }
          
        }






      })

      var fieldMap = [].concat.apply([], fields);


      return fieldMap.filter(function (field) {
        return field != undefined
          && this.props.sao_props.screen.model.fields.hasOwnProperty(field)
      }.bind(this))

    }
  }

  getListStyle(list_view_style) {

    let res = {}
    let lvs = list_view_style !== undefined ? list_view_style : this.state.current_view.list_view_style
    if (!lvs) {

      lvs = this.props.sao_props.session.context.list_view_style ?
        this.props.sao_props.session.context.list_view_style
        :
        'comfortable'
    }
    res.style = lvs;
    res.row_height = lvs === 'compact' ? 20 : 40



    return res;

    // this.state.current_view.list_view_style === 'comfortable' ? 'compact':'comfortable'
  }

  setColumns(cols, list_view_style) {
    var columns = cols ? cols : [...this.props.sao_props.columns]
    var show_footer = false;
    let uniques = []
    //list of prefixes to append on request read
    var prefixes = []
    let extra_fields = []
    let drag_sortable = false;
    // let rowHeight = list_view_style === 'compact' ? 20:40;
    const listStyle = this.getListStyle(list_view_style)
    let rowHeight = listStyle.row_height

    // let rowHeight = 40;
    var visibleColumns = [...columns].filter(function (col) {

      if (col.attributes.sum && !show_footer) {
        show_footer = true
      }

      //Currently only supporting row special height in case of images
      if (col.attributes.widget === 'image' && col.attributes.height) {
        rowHeight = col.attributes.height > rowHeight ? col.attributes.height : rowHeight
      }



      if (col.attributes.states &&
        col.attributes.states.length > 2
        && !this.props.sao_props.screen.current_view.editable) {


        extra_fields = this.getStateAttrFields(col)



      }





      var inversion = new window.Sao.common.DomainInversion();
      var inv_domain = inversion.domain_inversion(this.props.sao_props.domain, col.attributes.name);


      if (typeof inv_domain != 'boolean') {
        inv_domain = inversion.simplify(inv_domain);
      }

      var unique = inversion.unique_value(inv_domain)[0];
      if (unique) {
        uniques.push(col.attributes.name)
        col.unique = true
      }

      if (col.prefixes && col.prefixes.length > 0) {

        col.prefixes.map(function (pref) {

          if (pref.icon && !pref.protocol) {
            prefixes.push(pref.icon)
          }

        })

      }


      
      return !col.attributes.tree_invisible
    }.bind(this)).filter(function (col) { return col.attributes.name !== this.props.sao_props.screen.exclude_field }.bind(this))



    if (this.props.sao_props.screen.current_view.attributes.sequence) {
      extra_fields.push(this.props.sao_props.screen.current_view.attributes.sequence)
      drag_sortable = this.props.sao_props.screen.current_view.attributes.sequence;


    }


    //TODO: REMOVE => using width 1 for recorded hidden columns
    let visibleFields = [...visibleColumns].filter(function (col) { return col.attributes.width != 1 && !col.unique })

    if (this.props.sao_props.screen.current_view.editable) {

      var column_names = visibleFields.map(function (column) { return column.attributes.name })

      extra_fields = Object.keys(this.props.sao_props.screen.model.fields).filter(function (field) {

        return column_names.indexOf(field) < 0 && prefixes.indexOf(field) < 0 && !this.props.sao_props.screen.context.hasOwnProperty(field)


      }.bind(this))
    }






    if (extra_fields && extra_fields.length > 0) {
      extra_fields = extra_fields.filter(function (field) {
        return visibleFields.map(function (column) { return column.attributes.name }).indexOf(field) < 0
          && !this.props.sao_props.screen.context.hasOwnProperty(field)


      }.bind(this))


    }



    this.setState(
      {
        fields: visibleColumns,
        visibleFields: visibleFields,
        prefixes: prefixes,
        extra_fields: extra_fields,
        show_footer: show_footer,
        unique_columns: uniques,
        drag_sortable: drag_sortable,
        rowHeight: rowHeight,
        list_style: listStyle.style


      })




    this.createActions(columns)



  }





  async createActions(fields) {

    var actions = { ...this.state.actions }
    var m2o_fields = []
    fields.map(function (column) {
      if (column.type === "field") {
        if (column.field.description.type === 'many2one') {

          m2o_fields.push({
            id: column.attributes.name,
            name: column.attributes.string,
            relation:column.field.description.relation
          })
        }

      }

    }.bind(this))

    let modelActions = await this.getModelActions(this.props.sao_props.screen.model_name)
    let relationActions = await this.getRelationActions(m2o_fields)

    actions.relationActions = relationActions
    actions.modelActions = modelActions

    this.setState({ actions: actions })
  }


  async getRelationActions(field_list) {

    var actions = []
    

    field_list.map(async function (field) {



      let response = await ws.Post('model.' + field.relation + '.view_toolbar_get', [], this.props.sao_props.session)



      actions.push({
        id: field.id,
        name: field.name,
        relation: field.relation,
        actions: response.result
      })

    }.bind(this))

    return actions

  }

  async getModelActions(model) {

    var actions = []
    let response = await ws.Post('model.' + model + '.view_toolbar_get', [], this.props.sao_props.session)
    return response.result



  }




  onOpenModal = () => {
    this.setState({ open_order_modal: true });
  };

  onCloseModal() {
    this.setState({ open_order_modal: false });
  };

  onSortColumnsEnd(ordered_columns, allColumns) {
    this.setState({
      visibleFields: ordered_columns,
      fields: allColumns,
      current_view_modified: this.state.current_view
    })

  }

  //used for update specific column. Applied only on visible fields, cause this prop it`s called with render purpose
  // use case: selection fields with functional option getter.


  updateColumn(columnIndex, column) {
    let columns = [...this.state.visibleFields]

    columns[columnIndex] = column


    this.setState({
      visibleFields: columns
    })
  }

  async getUserViews() {
    const user_id = this.props.sao_props.session.user_id
    const view_id = this.props.sao_props.screen.current_view.view_id
    const action = this.props.sao_props.screen.attributes.action
    let user_views = {}
    const type = this.props.sao_props.screen.current_view.view_context
    if (type === "o2m") {
      let field = {}
      field.name = this.props.sao_props.field_instance.field_name
      field.model = this.props.sao_props.field_instance.model.name
      field.relation = this.props.sao_props.field_instance.attributes.relation
      user_views = await ws.Post('model.user.view.user_views_get', [user_id, false, field], this.props.sao_props.session)
    }
    else {
      //get regular list views
      if (view_id) {
        user_views = await ws.Post('model.user.view.user_views_get', [user_id, view_id], this.props.sao_props.session)
      }
      else if (action) {
        user_views = await ws.Post('model.user.view.user_views_get', [user_id, false, false, action], this.props.sao_props.session)
      }


    }


    const uv = user_views.result ? user_views.result : []
    let current_view = false


    let default_view = uv.filter(function (view) { return view.default === true })
    if (default_view.length) {
      current_view = default_view[0]



      let fields = await this.getUserViewFields(current_view.id)

      this.setColumns(fields, current_view.list_view_style)
    }
    else {
      this.setColumns(false)
      current_view = DEFAULT_VIEW

    }

    if(current_view.records_qty){
      
      this.props.sao_props.screen.limit = current_view.records_qty
    }
    if (type === "list_view") {
      if (current_view.search) {
        
        this.props.sao_props.screen.screen_container.set_text(current_view.search)
        this.props.sao_props.screen.search_filter(current_view.search);
      }
      // this.props.sao_props.screen.screen_container.do_search()
      else{
        this.props.sao_props.screen.search_filter();
      }
      

    }


    this.setState({
      user_views: uv,
      current_view: current_view
    })


  }

  //HERE => Rethink method and merge
  //HERE => Check widget inheritance => Maybe take the original widget, check if its working
  // HERE => visual, widget and footers could be overriden
  async getUserViewFields(view_id) {
    let fields = await ws.Post('model.user.view.user_view_fields_get', [view_id], this.props.sao_props.session)
    let original_fields = [...this.props.sao_props.columns]


    let descriptions = {}
    fields.result.forEach(function (field) {
      if (field.type !== 'button') {
        descriptions[field.name] = field.field.description
      }

    })

    const added_fields = this.props.sao_props.screen.model.add_fields(descriptions)

    const findOriginal = (name) => {
      return {
        ...original_fields.filter(function (field) {
          return field.attributes.name === name
        })[0]
      }
    }

    const mergeAttributes = (user, original) => {

      const original_attr = { ...original.attributes }
      const user_attr = { ...user.attributes }
      const result = Object.assign(original_attr, user_attr)


      return result
    }

    const res = fields.result.map(function (field) {
      let f;
      if (field.type === 'button') {
        f = findOriginal(field.attributes.name)
        f.attributes.width = field.attributes.width
        return f
      }

      if (!added_fields.includes(field.name)) {

        f = findOriginal(field.name)

        if (f.attributes) {


          f.attributes = mergeAttributes(field, f)
          f.field = this.props.sao_props.screen.model.fields[field.name]
        }
        else {
          f = field
          f.field = this.props.sao_props.screen.model.fields[field.name]
        }

      }
      else {

        f = field
        f.field = this.props.sao_props.screen.model.fields[field.name]
      }
      f.sortable = f.field && f.field.description.sortable


      return f

    }.bind(this))


    return res
  }


  //HERE => TODO => Check double read on change view
  async changeView(new_view) {
    if (new_view.value != this.state.current_view.id) {
      let cv = { 'id': new_view.value, 'rec_name': new_view.label }

      

      if (new_view.value === 0) {
        this.setColumns(false, false)
        this.props.sao_props.screen.limit = 200
        this.props.sao_props.screen.screen_container.set_text("")
        this.props.sao_props.screen.screen_container.do_search()
        
      }
      else {
        cv = this.state.user_views.filter(function (view) { return view.id === new_view.value })[0]

        //update records qty on view change
        let records_qty = cv.records_qty ? cv.records_qty:200
        this.props.sao_props.screen.limit = records_qty

        let cols = await this.getUserViewFields(new_view.value)
        this.setColumns(cols, cv.list_view_style)
        const search = cv.search ? cv.search : ""

        this.props.sao_props.screen.screen_container.set_text(search)
        this.props.sao_props.screen.screen_container.do_search()

      }

      this.setState({
        current_view: cv
      })


    }
  }

  setCurrentModified(modified_view) {
    let mods = {}
    if (!this.state.current_view_modified) {
      mods = modified_view
    }
    else {
      mods = { ...this.state.current_view_modified, ...modified_view }
    }
    this.setState({
      current_view_modified: mods
    })


  }

  async updateViews(views, default_index) {
    let default_id = false;
    let reset = false;
    if (default_index !== false) {
      default_id = views[default_index].id
    }
    else {
      default_id = views[0].id
      reset = true;
    }


    await ws.Post('model.user.view.user_view_set_default_view', [default_id, this.props.sao_props.session.user_id, reset], this.props.sao_props.session)
    this.setState({
      user_views: views
    })



  }

  async deleteViews(views) {
    const ids = [...views].map(function (v) { return v.id })

    let updated_views = [...this.state.user_views].filter(function (view) {
      return !ids.includes(view.id)
    })

    await ws.Post('model.user.view.delete', [ids], this.props.sao_props.session)

    this.setState({
      user_views: updated_views
    })


  }

  switchViewMode() {
    const cv = { ...this.state.current_view }




    const lvs = this.getListStyle()


    cv.list_view_style = lvs.style === 'compact' ? 'comfortable' : 'compact'



    this.setState({
      current_view: cv,
      rowHeight: cv.list_view_style === 'compact' ? 20 : 40,
      // rowHeight:cv,
      current_view_modified: true,
      list_style: cv.list_view_style

    })
  }

  discardViewChanges() {

    this.setState({
      current_view_modified: false
    })

  }

  async saveView(view) {
    const type = this.props.sao_props.screen.current_view.view_context
    let new_fields = []
    const getOrder = () => {
      if (!this.state.current_view_modified.order) {
        return ""
      }

      const fname = this.state.visibleFields[this.state.current_view_modified.order.index].attributes.name
      const dir = this.state.current_view_modified.order.order ? 'ASC' : 'DESC'

      return [fname, dir]


    }

    const newField = (field, index) => {
      if (field.attributes) {
        const width = this.state.current_view_modified.widthMap && this.state.current_view_modified.widthMap[index] ?
          this.state.current_view_modified.widthMap[index]
          :
          field.attributes.width
        if (field.type === 'field') {


          return {
            'type': 'field',
            'name': field.field.name,
            'widget': field.attributes.widget,
            'visual': field.attributes.visual ? field.attributes.visual : "",
            'width': width,
            'id': field.attributes.id && view.id > 0 ? field.attributes.id : -1,
            'sequence': index,
            'db_field': field.attributes.db_field ? field.attributes.db_field : -1,


          }
        }
        else {
          return {
            'type': 'button',
            'name': field.attributes.name,
            'width': width,
            'sequence': index



          }
        }
      }




    }

    if (!view.id) {
      view.id = -1

    }
    view.name = view.rec_name
    view.default = view.default ? view.default : false
    view.global_available = view.global_available ? view.global_available : false

    if (view.list_view_style) {
      view.list_view_style = view.list_view_style.value ? view.list_view_style.value : view.list_view_style
    }
    else {
      view.list_view_style = ""
    }
    // view.list_view_style = view.list_view_style ? view.list_view_style:""

    view.order = getOrder()
    if (type === 'list_view') {
      if (this.props.sao_props.screen.current_view.view_id > 0) {
        view.view_id = this.props.sao_props.screen.current_view.view_id
      }
      else {
        view.action = this.props.sao_props.screen.attributes.action
        view.view_id = false
      }


    }
    else {
      view.view_id = false
      let field_data = {}
      field_data.name = this.props.sao_props.field_instance.field_name
      field_data.model = this.props.sao_props.field_instance.model.name
      field_data.relation = this.props.sao_props.field_instance.attributes.relation
      view.field_data = field_data

    }


    this.state.visibleFields.forEach(function (field, index) {
      let new_field = newField(field, index)
      if (new_field) {
        new_fields.push(new_field)
      }
    })
    view.fields = new_fields

    //Add filters to view
    view.search = view.filters ? this.props.sao_props.screen.screen_container.get_text():""

    //Add records QTY to view
    view.records_qty = view.add_records_qty ? parseInt(this.props.sao_props.screen.limit):200

    view.user = this.props.sao_props.session.user_id



    let res = await ws.Post('model.user.view.user_view_set', [view], this.props.sao_props.session)


    let cv = { ...view }
    let uv = [...this.state.user_views]
    delete cv['fields']

    if (view.id < 0) {
      cv.id = res.result
      uv.push(cv)
    }



    this.setState({
      current_view_modified: false,
      user_views: uv,
      current_view: cv
    })
  }

  changeViewLimit(value){
    
    this.props.sao_props.screen.limit = value
    this.props.sao_props.screen.screen_container.do_search();
  }




  render() {

    return (

      <div className="App">
        {this.state.tab_domain ?
          <TabDomain
            tabs={this.props.sao_props.screen.screen_container.tab_domain}
            active_tab={this.props.sao_props.screen.screen_container.active_tab}
            set_active_tab={this.props.sao_props.screen.screen_container.set_active_tab}
            group={this.props.sao_props.group}
            screen={this.props.sao_props.screen}
          /> : ""


        }
        {/* TODO: improve this condition */}

        {this.state.current_view
          && document.getElementById(this.props.element_id + "_user_view_list")
          && this.props.sao_props.session.context.view_manager_access.active
          //Disable viewManager for lims.interface.data
          && this.props.sao_props.screen.model.name !== 'lims.interface.data'
          ?
          <Portal target={this.props.element_id + "_user_view_list"}>
            <ViewManager
              user_views={this.state.user_views}
              current_view={this.state.current_view}
              changeView={this.changeView}
              discardChanges={this.discardViewChanges}
              modified={this.state.current_view_modified}
              target={this.props.element_id + "_user_view_list"}
              saveView={this.saveView}
              deleteViews={this.deleteViews}
              updateViews={this.updateViews}
              root_element={this.props.element_id}
              widget_type={this.props.sao_props.screen.current_view.view_context}
              manage_columns={this.onOpenModal}
              switchViewMode={this.switchViewMode}
              access={this.props.sao_props.session.context.view_manager_access}
              // screen={this.props.sao_props.screen}
              records_qty ={this.props.sao_props.screen.limit}
              changeViewLimit = {this.changeViewLimit}
              board_child = {this.props.sao_props.screen.board_child}
            />
          </Portal>
          :
          ""
        }

        {this.state.current_view && this.state.visibleFields.length ?

          <React.Fragment>
            <VListView
              columns={this.state.visibleFields}
              allColumns={this.state.fields}
              group={this.props.sao_props.group}
              currentScreen={this.props.sao_props.screen}
              session={this.props.sao_props.session}
              actions={this.state.actions}
              parentId={this.props.element_id}
              type={this.props.sao_props.view_context}
              editable={this.props.sao_props.screen.current_view.editable}
              field_instance={this.props.sao_props.field_instance}
              prefixes={this.state.prefixes}
              extra_fields={this.state.extra_fields}
              show_footer={this.state.show_footer}
              updateColumn={this.updateColumn}
              unique_columns={this.state.unique_columns}
              drag_sortable={this.state.drag_sortable}
              rowHeight={parseInt(this.state.rowHeight)}
              setModified={this.setCurrentModified}
              current_view={this.state.current_view}
              list_view_style={this.state.list_style}
            />

            {this.state.open_order_modal &&
              //  {true &&
              <ColumnManager
                currentColumns={this.state.visibleFields}
                allColumns={this.state.fields}
                open={this.state.open_order_modal}
                // open={true}
                setColumns={this.onSortColumnsEnd}
                root_element={this.props.element_id}
                model={this.props.sao_props.screen.model}
                screen={this.props.sao_props.screen}
                session={this.props.sao_props.session}
                onClose={this.onCloseModal}
                noRemove={this.props.sao_props.screen.current_view.editable}
                access={this.props.sao_props.session.context.view_manager_access}
              />

            }

          </React.Fragment>
          :
          ""
        }


      </div>
    );
  }


}

export default TreeView;