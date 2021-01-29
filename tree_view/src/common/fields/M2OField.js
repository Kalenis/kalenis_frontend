import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select'

const { Option } = components;
const Sao = window.Sao

const customStyles = {
  menu: (provided, state) => ({
    ...provided,
    borderRadius: '0px',
    marginTop: '0px'
  }),

  control: (provided, state) => ({

    ...provided,
    border: '0px',
    backgroundColor: 'transparent',
    boxShadow: 'none',


  }),
  clearIndicator: (provided, state) => ({

    ...provided,
    cursor: 'pointer',
    ':hover': {

      color: 'red',
    },


  }),
  menuPortal: (provided, state) => ({
    ...provided,
    zIndex: 9999
  }),



}
const compactStyles = {
  menu: (provided, state) => ({
    ...provided,
    borderRadius: '0px',
    marginTop: '0px'
  }),

  control: (provided, state) => ({

    ...provided,
    border: '0px',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    minHeight: '20px'


  }),
  valueContainer: (provided, state) => ({
    ...provided,
    padding: '0px'

  }),
  clearIndicator: (provided, state) => ({

    ...provided,
    cursor: 'pointer',
    ':hover': {

      color: 'red',
    },


  }),
  menuPortal: (provided, state) => ({
    ...provided,
    zIndex: 9999
  }),
  indicatorsContainer: (provided, state) => ({
    ...provided,
    // backgroundColor: 'transparent',
    // color:'white'
    height: '20px'
  }),
  indicatorSeparator: (provided, state) => ({
    // ...provided,
    display: 'none'
    // height: '30px'
  }),



}

const widgetKeys = ['ArrowDown', 'ArrowUp', 'Enter']

function M2OField(props) {

  const [inputValue, setInputValue] = useState("");

  const [filterText, setFilterText] = useState("");
  const [openAutoSearch, setOpenAutoSearch] = useState(false)
  const [focusedOption, setFocusedOption] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false);

  //select approach
  const [options, setOptions] = useState([])




  useEffect(() => {



    // if (!filterText) {


    let input_value = getRecName()
    setInputValue(input_value)


    // }


  }, [props.value.rec_name]);


  function getRecName() {

    let rec_name = props.value.rec_name ? props.value.rec_name : ""


    //select approach

    let value = { value: props.value.id, label: props.value.rec_name }
    let new_options = [value]
    setOptions(new_options)

    return value

  }

  function getModel() {
    if (props.model) {
      return props.model;

    }
    else {
      return props.field.description.relation;
    }
  }

  function setValue(value) {
    props.setValue(value)
    setFilterText('')
    setOpenAutoSearch(false)
  }

  function windowCallback(result) {
    if (result && result[0]) {

      setValue(result[0][0])

      // this.setState({
      //   value: this.props.record._values[this.props.field.name.concat('.')].rec_name,
      //   openAutoSearch: false,
      //   focusedOption: null


      // }, () => this.props.focusCell())

    }
  }

  function getAccess(type) {

    if (props.field.description.relation) {
      return Sao.common.MODELACCESS.get(props.field.description.relation)[type];
    }
    return true;
  }

  function createAccess() {

    return props.field.description.create && getAccess('create')


  }

  function openSearchWindow() {

    if (!props.states.readonly) {


      var domain = props.field.get_domain(props.record);
      var context = props.field.get_search_context(props.record);
      var order = props.field.get_search_order(props.record);
      var text = filterText ? filterText : "";
      var model = getModel();


      var parser = new Sao.common.DomainParser();
      new Sao.Window.Search(model,
        windowCallback, {
        sel_multi: false,
        context: context,
        domain: domain,
        order: order,

        //Check view ids
        view_ids: ('').split(','),
        views_preload: (props.field.views || {}),
        new_: createAccess(),
        search_filter: parser.quote(text),
        title: props.field.description.string
      });

    }

  }

  function getScreen() {
    var domain = props.field.get_domain(props.record);

    var context = props.field.get_search_context(props.record);

    var model = getModel();


    return new Sao.Screen(model, {
      'context': context,
      'domain': domain,
      'mode': ['form'],
      'view_ids': ('').split(','),
      // 'views_preload': this.attributes.views,
      //TODO
      'readonly': false
    });
  }

  function openRecord(e) {
    var m2o_id = inputValue.id;


    if (!m2o_id) {
      m2o_id = props.record._values[props.field.name]
    }

    //reference field case
    if (Array.isArray(m2o_id)) {
      m2o_id = m2o_id[1]
    }


    if (e && e.shiftKey) {
      var params = {};
      params.model = getModel();
      params.res_id = m2o_id;
      params.mode = ['form'];
      params.name = props.field.description.string;
      Sao.Tab.create(params);
      return;
    }

    var screen = getScreen();
    let callback = function (result) {

      if (result) {
        var rec_name_prm = screen.current_record.rec_name();
        rec_name_prm.done(function (name) {

          let value = [m2o_id, name]

          setValue(value)


        }.bind(this));
      }
    };
    screen.switch_view().done(function () {
      screen.load([m2o_id]);

      let win = new Sao.Window.Form(screen, callback, {
        save_current: true,
        title: props.field.description.string
      });
    }.bind(this));
    return;
  }

  function newRecord() {
    var model = props.field.description.relation;
    if (!model || !Sao.common.MODELACCESS.get(model).create) {
      return;
    }
    var screen = getScreen()
    var callback = function (result) {
      if (result) {
        var rec_name_prm = screen.current_record.rec_name();
        rec_name_prm.done(function (name) {
          var value = [screen.current_record.id, name]
          setValue(value);
        });
      }
    };
    var rec_name = ""
    screen.switch_view().done(function () {
      new Sao.Window.Form(screen, callback, {
        new_: true,
        save_current: true,
        title: props.field.description.string,
        rec_name: rec_name
      });
    }.bind(this));
  }



  function handleKeyDown(e) {

    if (widgetKeys.includes(e.key)) {

      return true


    }
    if (props.navigate_signals.includes(e.key)) {
      if (e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        props.navigate('ArrowLeft')
        return true
      }
      props.navigate(e.key)
      e.preventDefault()
      return true;
    }


    if (!props.states.readonly) {




      if (e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        props.navigate('ArrowLeft')
        return true
      }

      switch (e.key) {
        case 'Backspace':
          clearField()
          break;
        case 'Delete':
          clearField()
          break;
        case 'Enter':
          e.preventDefault()
          if (!props.value.rec_name) {
            openSearchWindow()
          }
          else {
            props.keyDownHandler(e, null, true, true)
          }

          break;
        case 'F2': {
          openSearchWindow()
          break;
        }
        case 'F3': {
          e.preventDefault();
          newRecord();
          break;
        }
        case 'Tab':
          if (filterText) {
            openSearchWindow()
            break;
          }
          else { break }

        default:

          break;
      }

    }


  }

  function handleChange(value) {

    if (value) {
      switch (value.value) {
        case 'search': return openSearchWindow();
        case 'create': return newRecord();
        default: return setValue(value.value)

      }

      // setValue(value.value)
    }
    else {
      setValue(null)
    }



  }

  function clearField() {
    setValue(null)
    if (filterText) {
      setInputValue("")
      setFilterText("")
    }
  }




  const loadOptions = (inputValue, callback) => {

    var entry = { val: () => { return inputValue } }
    var model = getModel()
    Sao.common.update_completion(entry, props.record, props.field, model).done(function (values) {

      let options = values.map(function (option) { return { value: option.id, label: option.rec_name } })
      options.push({ value: 'create', label: Sao.i18n.gettext("Create...") })
      options.push({ value: 'search', label: Sao.i18n.gettext("Search...") })
      callback(options)


    })


  };

  const onInputChange = (inputValue, { action }) => {

    switch (action) {
      case 'input-change':
        if (inputValue) {
          setMenuOpen(true);
          setFilterText(inputValue)
        }
        return;
      case 'menu-close':
        setMenuOpen(false);

        return;

      default:
        return;
    }
  }

  const DropDown = ({ innerProps, isDisabled }) =>
    !isDisabled ? (
      <div {...innerProps}>
        <FontAwesomeIcon
          onClick={openSearchWindow}
          className={props.states.readonly ? "disabled-icon" : "hoverable-icon"}
          style={{ marginLeft: '5px' }}
          icon={faSearch} />
      </div>
    ) : null;


  const CustomSelectOption = (props) =>
    (
      <Option {...props}>
        {props.data.value === 'search' &&
          <FontAwesomeIcon
            style={{ marginRight: '5px' }}
            icon={faSearch}
            className="primary-icon" />
        }

        {props.data.value === 'create' &&
          <FontAwesomeIcon
            style={{ marginRight: '5px' }}
            icon={faPlus}
            className="primary-icon" />
        }


        {props.data.label}

      </Option>
    )





  return (

    <React.Fragment>

      <div style={{ backgroundColor: props.states.readonly === true ? "rgba(234,234,234,0.8)" : '' }} className="field-with-icon">

        {inputValue.label ?
          <FontAwesomeIcon
            onClick={openRecord}
            className="hoverable-icon"
            icon={faExternalLinkAlt}
            style={{ marginRight: '5px' }}
          /> :
          ""
        }

        <div style={{ width: '100%', lineHeight: 1 }}>
          <AsyncSelect
            ref={props.referenceChild ? null : props.parentRef}
            isSearchable
            isClearable
            placeholder={Sao.i18n.gettext("Search...")}
            noOptionsMessage={() => { return "" }}
            value={inputValue}
            required={props.states.required}
            isDisabled={props.states.readonly}
            styles={props.compact ? compactStyles : customStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
            onChange={handleChange}
            onInputChange={onInputChange}
            options={options}
            onKeyDown={handleKeyDown}
            loadOptions={loadOptions}
            menuIsOpen={menuOpen}
            components={{ DropdownIndicator: DropDown, Option: CustomSelectOption }}

          />

        </div>





      </div>


    </React.Fragment>



  )
}


export default M2OField;