import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import './css/modal.css'
import './css/fields.css'

import TreeView from './list_view/TreeView.js';
import HtmlField from './common/fields/HtmlField.js'

var Components = {
  delete: element => ReactDOM.unmountComponentAtNode(element),
  createTreeView: element => ReactDOM.render(<TreeView sao_props={element.sao_props} element_id={element.element.id} />, element.element),
  createHtmlField: element => ReactDOM.render(<HtmlField sao_props={element.sao_props} element_id={element.element.id} />, element.element),
  
  
}

export default window.Sao.KalenisAddons.Components = Components;