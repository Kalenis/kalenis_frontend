import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { components } from 'react-select'
import Button from '../common/Button';
import Modal from '../ui/Modal';
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { faUndo } from '@fortawesome/free-solid-svg-icons'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { faColumns } from '@fortawesome/free-solid-svg-icons'
import { faCog } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Sao = window.Sao

const { Option } = components;

const row_options = [
    {value:200, label:'200 '+window.Sao.i18n.gettext('Rows')},
    {value:500, label:'500 '+window.Sao.i18n.gettext('Rows')},
    {value:1000, label:'1000 '+window.Sao.i18n.gettext('Rows')},
    {value:2000, label:'2000 '+window.Sao.i18n.gettext('Rows')},
]

const ListViewStyles = {
    menu: (provided, state) => ({
        ...provided,
        borderRadius: '0px',
        marginTop: '0px'
    }),
    container: (provided, state) => ({
        ...provided,
        width: '80%'
    }),
    menu: (provided, state) => ({
        ...provided,
        width: '150px'
    }),

    control: (provided, state) => ({

        ...provided,

        height: '100%',
        minHeight: '1px',

    }),
    menuPortal: (provided, state) => ({
        ...provided,
        zIndex: 9999
    }),

    valueContainer: (provided, state) => ({
        ...provided,
        height: '20px',

    }),
    indicatorsContainer: (provided, state) => ({
        ...provided,
        height: '30px'
    }),


}

const One2ManyStyles = {
    menu: (provided, state) => ({
        ...provided,
        borderRadius: '0px',
        marginTop: '0px'
    }),
    container: (provided, state) => ({
        ...provided,
        // width: '80%'
    }),

    control: (provided, state) => ({

        ...provided,

        height: '100%',
        // minHeight: '1px',
        backgroundColor: 'transparent',
        border: 'none',
        minHeight: '0px'

    }),
    menu: (provided, state) => ({
        ...provided,
        width: '150px'
    }),
    menuPortal: (provided, state) => ({
        ...provided,
        zIndex: 9999
    }),

    valueContainer: (provided, state) => ({
        ...provided,
        height: '20px',
        display: 'none'

    }),
    indicatorsContainer: (provided, state) => ({
        ...provided,
        backgroundColor: 'transparent',
        // color:'white'
        // height: '30px'
    }),
    dropdownIndicator: (provided, state) => ({
        ...provided,
        // backgroundColor: 'transparent',
        color: 'white',
        ':hover': {

            color: 'white',
        },
        // height: '30px'
    }),
    indicatorSeparator: (provided, state) => ({
        // ...provided,
        display: 'none'
        // height: '30px'
    }),


}
const selectFormStyles = {
    menuPortal: (provided, state) => ({
        ...provided,
        zIndex: '9999'
    }),
}

const getDefaultIndex = (list) => {
    return list.findIndex(i => i.default === true);

}

function ViewForm(props) {

    const [view, setView] = useState({})
    const list_styles_options = [
        { 'label': Sao.i18n.gettext('Comfortable'), 'value': 'comfortable' },
        { 'label': Sao.i18n.gettext('Compact'), 'value': 'compact' },
    ]

    useEffect(() => {

        setView(props.view)

    }, [props.view]);

    function onViewChange(e) {
        const nv = { ...view }
        nv[e.target.id] = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setView(nv)
    }

    function styleChange(value) {
        const nv = { ...view }
        nv['list_view_style'] = value
        setView(nv)
    }

    return (
        <div style={{ minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-title" style={{ paddingLeft: '0px' }}> {Sao.i18n.gettext('New View')}</div>
            <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>

                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '1rem' }}>
                    <label className="form-label">{Sao.i18n.gettext('Default')}: </label>
                    <input
                        id="default"
                        type="checkbox"
                        value={view.default}
                        onChange={onViewChange}
                        style={{ marginLeft: '.5rem', marginTop: '2px' }}

                    />
                    <label style={{ marginLeft: '.5rem' }} className="form-label">{Sao.i18n.gettext('Filters')}: </label>
                    <input
                        id="filters"
                        type="checkbox"
                        value={view.include_filters}
                        onChange={onViewChange}
                        style={{ marginLeft: '.5rem', marginTop: '2px' }}

                    />
                    <label style={{ marginLeft: '.5rem' }} className="form-label">{Sao.i18n.gettext('Records Quantity')}: </label>
                    <input
                        id="add_records_qty"
                        type="checkbox"
                        value={view.add_records_qty}
                        onChange={onViewChange}
                        style={{ marginLeft: '.5rem', marginTop: '2px' }}

                    />
                    {props.access.edit_global &&
                        <>
                            <label style={{ marginLeft: '.5rem' }} className="form-label">{Sao.i18n.gettext('Available to all users')}: </label>
                            <input
                                id="global_available"
                                type="checkbox"
                                value={view.global_available}
                                onChange={onViewChange}
                                style={{ marginLeft: '.5rem', marginTop: '2px' }}

                            />
                        </>
                    }

                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">{Sao.i18n.gettext('Name')} </label>
                    <input
                        id="rec_name"
                        value={view.rec_name}
                        onChange={onViewChange}
                        className="form-control input-sm mousetrap"
                    />
                </div>
                <label className="form-label">{Sao.i18n.gettext('View Style')} </label>
                <Select
                    isSearchable={false}
                    value={view.list_view_style}
                    styles={selectFormStyles}
                    menuPortalTarget={document.body}
                    menuPosition={'fixed'}
                    onChange={styleChange}
                    options={list_styles_options}

                />




            </div>
            <div style={{ display: 'flex', marginTop: 'auto' }}>
                <Button style={{ lineHeight: 1.5, backgroundColor: "#e7e7e7", color: "rgb(40,80,146)" }} label={Sao.i18n.gettext('Cancel')} onClick={() => props.cancel(false)} states={{}} />
                <Button style={{ lineHeight: 1.5 }} label={Sao.i18n.gettext('OK')} onClick={() => props.confirm(view)} states={{}} />
            </div>

        </div>
    )

}

function ViewList(props) {
    const [view_list, setViewList] = useState([])


    useEffect(() => {
        const vl = [...props.views].map(function (view) {
            const v = { ...view }
            v.deleted = false;
            return v
        })


        setViewList(vl)


    }, [props.views]);



    function setDefault(index) {
        let vl = [...view_list]
        let current_default = getDefaultIndex(vl)

        if (current_default >= 0 && current_default !== index) {
            vl[current_default].default = false
        }

        vl[index].default = !vl[index].default;
        setViewList(vl);

    }

    function toogleDelete(index) {
        let vl = [...view_list]
        if (vl[index].global_available && !props.access.edit_global) {
            return;
        }
        vl[index].deleted = !vl[index].deleted;
        setViewList(vl)
    }


    return (
        <div style={{ display: 'flex', height: '400px', minWidth: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className="modal-title">{Sao.i18n.gettext('Manage Views')}</div>

                <div style={{ maxHeight: '400px', overflow: 'scroll', flexGrow: 1 }} className="cm-sortable-container">
                    {view_list.map((value, index) => (
                        <div
                            key={value.id}
                            className="cm-sortable-item">
                            <span style={{ flexGrow: 1 }} className={value.deleted ? "cm-deleted-row" : ""}>
                                {value.rec_name ?
                                    value.rec_name :
                                    ""}
                            </span>
                            {!value.deleted ?
                                <FontAwesomeIcon
                                    onClick={(e) => { setDefault(index) }}
                                    className="cm-sortable-icon cm-sortable-icon-primary:hover"
                                    style={{ color: value.default ? "rgb(40,80,146)" : '', fontSize: "14px", fontStyle: 'normal', marginRight: '3rem' }}
                                    icon={faCheck} />
                                :
                                null
                            }


                            {value.deleted ?
                                <FontAwesomeIcon
                                    onClick={(e) => { toogleDelete(index) }}
                                    className="cm-sortable-icon cm-sortable-icon-primary"
                                    style={{ fontSize: "14px", fontStyle: 'normal' }}
                                    icon={faUndo} />
                                :
                                <FontAwesomeIcon
                                    onClick={(e) => { toogleDelete(index) }}
                                    className="cm-sortable-icon cm-sortable-icon-cancel"
                                    style={{ fontSize: "14px", fontStyle: 'normal', color: value.global_available && !props.access.edit_global ? "transparent" : "" }}
                                    icon={faTimes} />



                            }


                        </div>

                    ))}

                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '50%', marginTop: '2rem', marginBottom: '2rem', alignSelf: 'flex-end' }}>
                    <Button style={{ backgroundColor: "#e7e7e7", color: "rgb(40,80,146)" }} label={Sao.i18n.gettext('Cancel')} onClick={() => props.cancel(false)} states={{}} />
                    <Button style={{ lineHeight: 1.5 }} label={Sao.i18n.gettext('OK')} onClick={() => props.confirm(view_list)} states={{}} />
                </div>





            </div>
        </div>
    )
}

function ButtonGroup(props) {
    const [save_access, setSaveAccess] = useState(false)


    useEffect(() => {
        let sa = false;
        if (props.current_view.global_available) {
            if (props.access.edit_global) {
                sa = true
            }

        }

        else if (props.current_view.id) {
            sa = true;
        }


        setSaveAccess(sa)


    }, [props.current_view, props.access]);



    return (
        <div style={{ width: props.fullw ? '100%' : '50%', display: 'flex', padding: '3px' }}>
            {save_access ?
                <Button style={{ lineHeight: 1.5 }} onClick={props.saveView} label={Sao.i18n.gettext('Save View')} states={{}} />
                :
                null
            }
            <Button style={{ lineHeight: 1.5 }} label={Sao.i18n.gettext('New View')}
                onClick={(e) => {
                    e.stopPropagation()
                    props.setNewViewModal(true)
                }}
                states={{}} />
        </div>)
}

function ViewManager(props) {

    const [options, setOptions] = useState([])
    const [value, setValue] = useState({})
    const [newViewModal, setNewViewModal] = useState(false)
    const [viewListModal, setViewListModal] = useState(false)
    const [records_qty, setRecordsQty] = useState("")





    useEffect(() => {

        const new_options = props.user_views.map(function (option) {
            return { 'label': option.rec_name, 'value': option.id }
        })
        new_options.push({ 'label': Sao.i18n.gettext('Base View'), 'value': 0 })
        new_options.push({ 'label': Sao.i18n.gettext('Change Row Height'), 'value': 'switch_compact' })
        if (props.access.editor) {
            new_options.push({ 'label': Sao.i18n.gettext('Manage Columns'), 'value': 'manage_columns' })
            new_options.push({ 'label': Sao.i18n.gettext('Settings'), 'value': 'manage' })
        }



        setOptions(new_options)

    }, [props.user_views]);

    

    useEffect(() => {

        setValue({ 'label': props.current_view.rec_name, 'value': props.current_view.id })

       

    }, [props.current_view]);

    useEffect(() => {
        if(props.widget_type === 'list_view'){
            const val = row_options.filter(function(opt){
                return opt.value === props.records_qty
            })[0]
     
            setRecordsQty(val)
            
        }
        
 
     }, [props.records_qty]);

   

    function selectChange(value) {

        switch (value.value) {
            case "manage":
                setViewListModal(true);
                break;
            case "manage_columns":
                props.manage_columns()
                break;
            case 'switch_compact':
                props.switchViewMode()
                break;
            default:
                props.changeView(value)
                break;
        }


    }

    function saveView(e) {

        props.saveView({ ...props.current_view })

    }

    function createView(view) {
        
        props.saveView(view)
        setNewViewModal(false)
    }


    async function updateViews(views) {

        let cv = [...props.user_views]

        let to_delete = [...views].filter(function (view) {
            return view.deleted === true

        })




        const current_default = getDefaultIndex(cv)
        let new_default = getDefaultIndex(views)



        if (current_default !== new_default) {
            if (current_default >= 0) {
                cv[current_default].default = false
            }

            if (new_default < 0) {
                new_default = false;
            }
            else {
                cv[new_default].default = true;
            }


            await props.updateViews(cv, new_default)

        }


        if (to_delete.length) {
            await props.deleteViews(to_delete)
        }

        setViewListModal(false);




    }



    const DropdownInd = (props) => (
        <components.DropdownIndicator {...props}>
            <FontAwesomeIcon
                // onClick={(e) => { setDefault(index) }}
                className="cm-sortable-icon cm-sortable-icon-primary:hover"
                style={{ fontSize: "16px", cursor: 'pointer', color: 'inherit' }}
                icon={faEye} />
        </components.DropdownIndicator>
    )

    const CustomSelectOption = (props) =>
    (
        <Option {...props}>
            {props.data.value === 'switch_compact' &&
                <FontAwesomeIcon
                    style={{ marginRight: '5px' }}
                    icon={faBars}
                    className="primary-icon" />
            }

            {props.data.value === 'manage' &&
                <FontAwesomeIcon
                    style={{ marginRight: '5px' }}
                    icon={faCog}
                    className="primary-icon" />
            }
            {props.data.value === 'manage_columns' &&
                <FontAwesomeIcon
                    style={{ marginRight: '5px' }}
                    icon={faColumns}
                    className="primary-icon" />
            }


            {props.data.label}

        </Option>
    )

    function changeViewLimit(value){
        
        props.changeViewLimit(value.value)
    }
   


    return (
        <>
            {props.widget_type === 'list_view' ?
                <Select
                    isSearchable={false}
                    value={records_qty}
                    components={{  Option: CustomSelectOption }}
                    styles={props.widget_type === 'list_view' ? ListViewStyles : One2ManyStyles}
                    menuPortalTarget={document.body}
                    // menuPortalTarget={document.getElementById(props.target)}
                    menuPosition={'fixed'}
                    onChange={changeViewLimit}
                    options={row_options}

                />
                :
                null
            }
            <Select
                isSearchable={false}
                value={value}
                components={{ DropdownIndicator: DropdownInd, Option: CustomSelectOption }}
                styles={props.widget_type === 'list_view' ? ListViewStyles : One2ManyStyles}
                menuPortalTarget={document.body}
                // menuPortalTarget={document.getElementById(props.target)}
                menuPosition={'fixed'}
                onChange={selectChange}
                options={options}

            />

            {props.modified &&
                props.access.editor ?
                <>
                    {props.widget_type === 'list_view' ?

                        <ButtonGroup
                            current_view={props.current_view}
                            setNewViewModal={setNewViewModal}
                            access={props.access}
                            saveView={saveView} />
                        :
                        <div
                            className="shadow-xl"
                            style={{
                                height: '30px',
                                width: '200px',
                                backgroundColor: 'white',
                                border: '1px solid lightgray',
                                borderBottom: '0px',
                                transform: 'translate(0px,-65px)',
                                display: 'flex'
                            }} >
                            <ButtonGroup
                                current_view={props.current_view}
                                setNewViewModal={setNewViewModal}
                                access={props.access}
                                saveView={saveView}
                                fullw />
                            <FontAwesomeIcon
                                onClick={props.discardChanges}
                                className="cm-sortable-icon cm-sortable-icon-cancel"
                                style={{ fontSize: "14px", fontStyle: 'normal', marginRight: '2px' }}
                                icon={faTimes} />

                        </div>


                    }
                </>
                :
                null


            }
            <Modal
                open={newViewModal}
                paper
                onRequestClose={() => { setNewViewModal(false) }}
                className="px-4 pt-6 pb-6"
            // target={props.root_element}


            >
                <ViewForm
                    view={{}}
                    cancel={setNewViewModal}
                    confirm={createView}
                    access={props.access}
                />
            </Modal>

            <Modal
                open={viewListModal}
                paper
                onRequestClose={() => { setViewListModal(false) }}
                className="px-4 pt-6"
            // target={props.root_element}
            >
                <ViewList
                    views={props.user_views}
                    cancel={() => { setViewListModal(false) }}
                    confirm={updateViews}
                    access={props.access}
                />
            </Modal>


        </>

    )
}

export default ViewManager