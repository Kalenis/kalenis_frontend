import React, { PureComponent } from 'react';





class ColumnFooter extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
     
      
    }

   this.sumFooter = this.sumFooter.bind(this);
   this.getFooter = this.getFooter.bind(this);

  }



  sumFooter(){
   
    var res = 0
    var digits = 2

   

    if(this.props.column.field.description.type === 'timedelta'){
        var sum = 0
        this.props.selected_rows.map(function(row_index){
            
            var value = this.props.group[row_index] ? this.props.group[row_index]._values[this.props.column.attributes.name]:false

            if(value){
              sum = sum+value.asSeconds()
            }
            }.bind(this))
        if(sum){
            var converter = this.props.column.field.converter(this.props.currentScreen);
            res =  window.Sao.common.timedelta.format(
                window.Sao.TimeDelta(null, sum), converter);
            return res;  
        }
        else{
          return 0
        } 
    }

    else{
        this.props.selected_rows.map(function(row_index){

            var increment = 0;
            if(this.props.group[row_index]){
              var field_digits = this.props.column.field.digits(this.props.group[row_index])
              
              if(field_digits){
                
                digits = field_digits[1]

               
              }
              increment = this.props.group[row_index]._values[this.props.column.attributes.name]

              
            }
            
      

            res = res + increment
    
           
            }.bind(this))
            return parseFloat(res).toFixed(digits)
    }
    
  
    
    
}

  getFooter(){

    var label = this.props.column.attributes.sum.concat(":")
    var amount = 0

   if(this.props.selected_rows.length){
    switch(this.props.operation){
      case "sum": 
          amount = this.sumFooter() 
          break;
      default:
        amount = -20
        break;
    }
   }
    

    return label.concat(amount.toString())
    
  }

  
  render() {
    return (
      <React.Fragment>
       {this.getFooter()}
      </React.Fragment>
    )
  }
}

export default ColumnFooter;