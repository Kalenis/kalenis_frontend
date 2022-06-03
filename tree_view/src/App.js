import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import './css/modal.css'
import './css/fields.css'

import TreeView from './list_view/TreeView.js';
import HtmlField from './common/fields/HtmlField.js'
// import {common} from 'kalenis-portal-frontend-main'
import {AppRoot, InjectContext} from 'kalenis-portal-frontend-main'
import {View_} from 'kalenis-web-components'
// import '../node_modules/kalenis-web-components/dist/index.css'
import 'kalenis-web-components/dist/index.css'

window.KalenisAddons = {}
const portal_connection_info = {
  "api_path":"http://192.168.0.106:5001/app/v1"
}


var Components = {
  delete: element => ReactDOM.unmountComponentAtNode(element),
  createTreeView: element => ReactDOM.render(
  <TreeView sao_props={element.sao_props} element_id={element.element.id} />
  , element.element),
  createHtmlField: element => ReactDOM.render(<HtmlField sao_props={element.sao_props} element_id={element.element.id} />, element.element),
  createPortalBridge: props => ReactDOM.render(
    <AppRoot connection_info={portal_connection_info}>
      <InjectContext {...props}/>
    </AppRoot>
    , document.getElementById('main_kp')),
  createPortalView: props => ReactDOM.render(<View_ {...props}/>, props.element)
  
  
}

export default window.KalenisAddons.Components = Components;