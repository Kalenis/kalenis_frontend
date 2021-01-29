import React, { PureComponent } from 'react';

// PROPS
// field: Field Object (temp is the column)
// widget: widget to show
const Sao = window.Sao;

class TimeDeltaField extends PureComponent {

  constructor(props) {
    super(props);
    

    this.state = {
      value:null
    };

    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  
  }

  handleValueChange(e){
    this.setState({
      value:e.target.value
    })
  }

  handleBlur(e){
    this.setState({value:null})
    
    
    
    
    // if(Sao.common.timedelta.format(this.props.record._values[this.props.field.name]) != e.target.value){
      if(this.convertValue() != e.target.value){

      this.props.setValue(e.target.value)

    }
    
   
    
  }

  handleKeyDown(e){
    this.props.keyDownHandler(e)
  }
  

  convertValue(){
    var converter = this.props.field.converter(this.props.screen);
    var value = ""

      if(this.props.record._values[this.props.field.name]){
        value = Sao.common.timedelta.format(Sao.TimeDelta(null, this.props.record._values[this.props.field.name].asSeconds()), converter);
      }
    
    
    return value 
  }

    
    render() {

       
        return(

       <React.Fragment>
         <input 
              label={"TimeDelta Field"} 
              readOnly={this.props.states.readonly}
              ref={this.props.parentRef}
              // value={this.state.value != null ? this.state.value:Sao.common.timedelta.format(this.props.record._values[this.props.field.name])} 
              value={this.state.value != null ? this.state.value:this.convertValue()}
              // placeholder={this.props.field.string}
              onChange={this.handleValueChange}
              onBlur={this.handleBlur}
              onKeyDown={this.handleKeyDown}
              className="field-grid-base"
              >    
          </input>
       </React.Fragment>
    )
    }
}

export default TimeDeltaField;