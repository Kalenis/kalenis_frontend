import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'


import { Menu, Item, Submenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.min.css';


class AutoComplete extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      search_index: this.props.actions.length + 1,
      create_index: this.props.actions.length + 2
    }
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onItemKeyDown = this.onItemKeyDown.bind(this);
  }




  onKeyDown(e) {
    if (e.key === "ArrowDown") {
      // e.preventDefault()
      console.log("Arrow Down en menu")
      this.props.setOptionFocus(this.props.focused + 1)
    }
    if (e.key === "ArrowUp") {
      this.props.setOptionFocus(this.props.focused - 1)
      console.log("ArrowUp")
    }
    if (e.key === "Enter") {

      switch (this.props.focused) {
        case (this.props.actions.length + 1): {
          console.log("estoy Buscando")
          this.props.search()
          break
        }
        case (this.props.actions.length + 2): {
          this.props.new_()
          break;
        }
        default: {
          e.preventDefault();
          var value = [[this.props.actions[this.props.focused].id, this.props.actions[this.props.focused].id.rec_name]]
          this.props.itemClick(value)
        }
      }


    }
  }

  setFocus(index) {
    // console.log("Set Focus on Hover")
    // console.log(e, index)
    this.props.setOptionFocus(index)


  
    // this.props.set
  }

  onItemClick(value) {
    this.props.itemClick(value)
  }

  onItemKeyDown(e, value) {

  }






  render() {

    return (
      <Menu onKeyDown={this.onKeyDown} tabindex="0" id={this.props.id} className="autocomplete-menu">
        {this.props.actions.map((option, index) => (
          <div onClick={() => { this.onItemClick([[option.id, option.rec_name]]) }}
            onMouseOver={(e) => { this.setFocus(index) }}
            className={this.props.focused === index ? "autocomplete-menu-item autocomplete-menu-item-active" : "autocomplete-menu-item"} key={option.id} >

               <input 
                    onKeyDown={this.onKeyDown} 
                    readOnly 
                    maxLength={50}
                    className="autocomplete-menu-input" 
                    ref={index === 0 ? this.props.menuRef : ""} 
                    value={option.rec_name.substring(0,25)} /> 

                  {/* <div 
                    onKeyDown={this.onKeyDown} 
                    readOnly 
                    className="autocomplete-menu-input" 
                    ref={index === 0 ? this.props.menuRef : ""} 
                   >{option.rec_name} </div>  */}


            </div>

        ))}


        <div onClick={this.props.search} onMouseOver={(e) => { this.setFocus(this.props.actions.length + 1) }} className={this.props.focused === this.props.actions.length + 1 ? "autocomplete-menu-item autocomplete-menu-item-active autocomplete-menu-item-default" : "autocomplete-menu-item autocomplete-menu-item-default"} key="search" >
          <FontAwesomeIcon style={{ paddingLeft: '2px', marginRight: "3px" }} icon={faSearch} />
          Buscar...
        </div>
        <div onClick={this.props.new_} onMouseOver={(e) => { this.setFocus(this.props.actions.length + 2) }} className={this.props.focused === this.props.actions.length + 2 ? "autocomplete-menu-item autocomplete-menu-item-active autocomplete-menu-item-default" : "autocomplete-menu-item autocomplete-menu-item-default"} key="create" >
          <FontAwesomeIcon style={{ paddingLeft: '2px', marginRight: "3px" }} icon={faPlus} />
          Crear...
           </div>


      </Menu>
    )
  }
}

export default AutoComplete;