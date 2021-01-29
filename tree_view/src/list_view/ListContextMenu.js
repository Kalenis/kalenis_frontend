import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFan } from '@fortawesome/free-solid-svg-icons'
import { faPrint } from '@fortawesome/free-solid-svg-icons'
import { faLevelDownAlt } from '@fortawesome/free-solid-svg-icons'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';


import { Menu, Item, Submenu, Separator } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.min.css';

const Sao = window.Sao

class ListContextMenu extends PureComponent {

  constructor(props) {
    super(props);
    this.itemRef = React.createRef();
    this.getRecName = this.getRecName.bind(this);
   
  }

  async getRecName(params, callback){
    let rec_name = await this.props.screen.current_record.rec_name()
    params.name = rec_name.substring(0,50);
   
    return callback(params);
    
    
  }

  openRecord(event, props, new_browser_tab) {
    var params = {};
    params.model = props.field ? props.field.relation : this.props.screen.current_record.model.name;
    params.res_id = props.field ? this.props.screen.current_record._values[props.field.id] : this.props.screen.current_record.id;

    params.mode = ['form'];
    params.name = props.field ? props.field.name : this.props.screen.attributes.name;

    var createTab = function(params){
      Sao.Tab.create(params, new_browser_tab);
    }

    if(!params.name){

      this.getRecName(params, createTab)
    }
    else{
      createTab(params)
    }


   

  }

  openAttachments(event, props){
    var id = props.field ? this.props.screen.current_record._values[props.field.id] : this.props.screen.current_record.id
    var model = props.field ? props.field.relation : this.props.screen.current_record.model.name

    let record;
    if(props.record){
      record = props.record;
    }
    else{
      
      record = new window.Sao.Record(new window.Sao.Model(model), id)
      record.group.add(record)
    }
    

    return new window.Sao.Window.Attachment(record, function() {
      if(props.screen.tab){
        props.screen.tab.refresh_resources(true)
      }
      
    })

  }

  executeSaoAction(event, props) {
    
    var id = props.field ? this.props.screen.current_record._values[props.field.id] : this.props.screen.current_record.id
    var model = props.field ? props.field.relation : this.props.screen.current_record.model.name


    Sao.Action.execute(props.action.id, { model: model, id: id, ids: [id] }, props.action.type, this.props.currentSession.context, props.action.keyword)

  }


  renderRelationItem(field) {


    if (this.props.screen.current_record && 
        this.props.screen.current_record._values[field.id] &&
         field.actions) {
      return (
        <Submenu key={field.id} label={field.name}>
          <Item key="edit" data={{ field: field }} onClick={({ event, props }) => { this.openRecord(event, props) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faFolderOpen} />  {window.Sao.i18n.gettext('Open')}  </Item>
          <Item key="attach-open" 
          data={{ field: field, screen:this.props.screen }} 
          onClick={({ event, props }) => { this.openAttachments(event, props) }}> 
          <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faPaperclip} />
            {window.Sao.i18n.gettext('Attachment')}   
            </Item>
          <Submenu key={'action'} label={window.Sao.i18n.gettext('Action')} disabled={field.actions.action.length > 0 ? false : true}>

            {field.actions.action.map((action) => (
              <Item key={action.id} data={{ action: action, field: field }} onClick={({ event, props }) => { this.executeSaoAction(event, props) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faFan} />{action.name}</Item>
            ))}

          </Submenu>

          <Submenu key={'relate'} label={window.Sao.i18n.gettext('Relate')} disabled={field.actions.relate.length > 0 ? false : true}>
            {field.actions.relate.map((action) => (
              <Item data={{ action: action, field: field }} onClick={({ event, props }) => { this.executeSaoAction(event, props) }} key={action.id}><FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faLevelDownAlt} />{action.name}</Item>
            ))}
          </Submenu>

          <Submenu key={'print'} label={window.Sao.i18n.gettext('Print')} disabled={field.actions.print.length > 0 ? false : true}>
            {field.actions.print.map((action) => (
              <Item key={action.id} data={{ action: action, field: field }} onClick={({ event, props }) => { this.executeSaoAction(event, props) }}><FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faPrint} />{action.name}</Item>
            ))}
          </Submenu>



        </Submenu>
      )
    }

  }



  render() {

    return (
      <Menu ref={this.itemRef} style={{ zIndex: 9999 }} id={this.props.id} onHidden={() => { this.props.hideContextMenu() }}>
        <Item key="copy" onClick={({ event, props }) => { this.props.copySingle(this.props.screen.current_record) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faCopy} />  {window.Sao.i18n.gettext('Copy')}  </Item>
        <Item key="copy-selection" onClick={({ event, props }) => { this.props.copySelection() }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faCopy} />  {window.Sao.i18n.gettext('Copy Selection')}  </Item>
        {this.props.editable &&
        // <Item key="copy-value" onClick={({ event, props }) => { this.props.copyToColumn() }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faCopy} />  {window.Sao.i18n.gettext('Copy Value')}  </Item>
        <Submenu key={'copy-value'}  label={window.Sao.i18n.gettext('Cell')}>
          <Item key="copy-value-up" onClick={({ event, props }) => { this.props.copyToColumn('up',props.rowIndex,props.columnIndex) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faArrowUp} />  {window.Sao.i18n.gettext('Copy Up')}  </Item>
          <Item key="copy-value-down" onClick={({ event, props }) => { this.props.copyToColumn('down', props.rowIndex,props.columnIndex) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faArrowDown} />  {window.Sao.i18n.gettext('Copy Down')}  </Item>
          

        </Submenu>
        }
        <Separator />
        <Item key="model-open" 
            data={{ field: false }} 
            onClick={({ event, props }) => { this.openRecord(event, props) }}> 

              <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} 
              icon={faFolderOpen} />
              {window.Sao.i18n.gettext('Open')} 
        </Item>
        <Item key="model-open-new-tab" 
            data={{ field: false }} 
            onClick={({ event, props }) => { this.openRecord(event, props, true) }}> 
            
              <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} 
              icon={faFolderOpen} />
              {window.Sao.i18n.gettext('Open in new Tab')}
        </Item>

        <Item key="attach-open" 
          data={{ field: false, record:this.props.screen.current_record, screen:this.props.screen }} 
          onClick={({ event, props }) => { this.openAttachments(event, props) }}> 
          <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faPaperclip} />
            {window.Sao.i18n.gettext('Attachment')}   
            </Item>

        <Submenu key={'model_action'} disabled={this.props.actions.modelActions.action.length > 0 ? false : true} label={window.Sao.i18n.gettext('Action')}>

          {this.props.actions.modelActions.action.map((action) => (
            <Item key={action.id} data={{ action: action, field: false }} onClick={({ event, props }) => { this.executeSaoAction(event, props) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faFan} />{action.name}</Item>
          ))}

        </Submenu>
        <Submenu key={'model_relate'} disabled={this.props.actions.modelActions.relate.length > 0 ? false : true} label={window.Sao.i18n.gettext('Relate')}>
          {this.props.actions.modelActions.relate.map((action) => (
            <Item key={action.id} data={{ action: action, field: false }} onClick={({ event, props }) => { this.executeSaoAction(event, props) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faLevelDownAlt} />{action.name}</Item>
          ))}
        </Submenu>
        <Submenu key={'model_print'} disabled={this.props.actions.modelActions.print.length > 0 ? false : true} label={window.Sao.i18n.gettext('Print')}>
          {this.props.actions.modelActions.print.map((action) => (
            <Item key={action.id} data={{ action: action, field: false }} onClick={({ event, props }) => { this.executeSaoAction(event, props) }}> <FontAwesomeIcon style={{ color: "rgb(40,80,146)", fontSize: "20px", marginRight: '5px', fontStyle: 'normal' }} icon={faPrint} />{action.name}</Item>
          ))}
        </Submenu>
        <Separator />

        {this.props.actions.relationActions.map((field) => (

          this.renderRelationItem(field)

        ))}





      </Menu>
    )
  }
}

export default ListContextMenu;

