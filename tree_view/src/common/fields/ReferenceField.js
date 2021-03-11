import React, { PureComponent, Component } from 'react';

// PROPS
// field: Field Object (temp is the column)
// widget: widget to show

import  M2OField  from './M2OField.js';
import  SelectField from './SelectField.js'


const Sao = window.Sao;
class ReferenceField extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      value: false,
      filter_text: false,
      model:false,

    }

   
    this.setSelectValue = this.setSelectValue.bind(this);
    this.setM2oValue = this.setM2oValue.bind(this);


  }



  


  

  setSelectValue(value){
     
      this.props.setValue(value)
  }

  setM2oValue(value){
    //   var Referencevalue = this.props.record._values[this.props.field.name][0];
    
    // this.setState({value:value})
     var Referencevalue = []
     Referencevalue[0] = this.props.record._values[this.props.field.name][0];
     Referencevalue[1] = value;
     
    
    this.props.setValue(Referencevalue)

    this.props.reloadRow(this.props.rowIndex)
    
   
    
      
  }


  render() {
   
    let model=false;
    let value={};
    if(Array.isArray(this.props.record._values[this.props.field.name]) && this.props.record._values[this.props.field.name][0]){
       
     
     model = this.props.record._values[this.props.field.name][0];
    //  value = this.props.record._values[this.props.field.name.concat('.')]
    value = {
            'id':this.props.record._values[this.props.field.name][1], 
            'rec_name':this.props.record._values[this.props.field.name.concat('.rec_name')]
          }


     
    //  console.log("Value for m2o from reference")
    //  console.log(value)
     if(!value){
       value = {}
     }
    }

    
   
   
  
    return (
       
      <React.Fragment>

        
        <div  className="field-with-icon">
          {/* <FontAwesomeIcon style={{ display: this.getSize(false) > 0 ? 'inline-block':'none' }} className="hoverable-icon" onClick={this.saveAs} icon={faCloudDownloadAlt} /> */}
          
          <SelectField 
            states={this.props.states} 
            parentRef={false} 
            navigate={this.props.navigate} 
            keyDownHandler={this.props.keyDownHandler} 
            navigate_signals={this.props.navigate_signals} 
            onEnterPress={this.props.onEnterPress} 
            field={this.props.field} 
            record={this.props.record}
            value={model} 
            column={this.props.column}
            setValue={this.setSelectValue}/>
        
        <M2OField
             states={this.props.states} 
             parentRef={this.props.parentRef} 
            // parentRef={false}
             navigate={this.props.navigate} 
             keyDownHandler={this.props.keyDownHandler} 
             navigate_signals={this.props.navigate_signals} 
             onEnterPress={this.props.onEnterPress} 
             field={this.props.field} 
             record={this.props.record} 
             setValue={this.setM2oValue}
             focusCell={this.props.focusCell}
             model={model}
             referenceChild={true}
             value={value}
             />
          
         

        </div>



      </React.Fragment>
    )
  }
}

export default ReferenceField;