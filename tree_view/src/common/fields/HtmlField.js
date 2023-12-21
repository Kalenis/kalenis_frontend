import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import Modal from 'react-responsive-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons'
const check_record_saved = "Save the record before add images"

const DropZone = (props) => {

    const [dragging, setDragging] = useState(false)


    function onDragOver(e) {
        e.preventDefault()
        setDragging(true)
    }

    function onDrop(e) {
        e.preventDefault()
        setDragging(false)
        return props.callback(e.dataTransfer.files)

    }

    const getStyle = () => {
        let style = {}
        if (dragging) {
            style = {
                border: '2px dashed rgb(40,80,146)',
                color: 'rgb(40,80,146)',
                cursor: 'copy',

            }
        }

        return style;

    }



    return (
        <div style={getStyle()} onDrop={onDrop} onDragOver={onDragOver} className={props.className}>

            {props.children}

        </div>
    )


}

const readFile = (file) => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve({ file: file, img: reader.result });
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    })
}


const isImage = (filename) => {

    return /[\/.](gif|jpg|jpeg|tiff|png|webp)$/i.test(filename);
}


const validateFileType = (filename, type) => {

    switch(type){
        case 'img': return /[\/.](gif|jpg|jpeg|tiff|png|webp)$/i.test(filename);
        case 'style': return /[\/.](css|less)$/i.test(filename);
    }
}

function AssetPicker(props) {

    const [attachs, setAttachs] = useState([])
    const [preview, setPreview] = useState(false)
    const [activeItem, setActiveItem] = useState(false)
    const [activeTab, setActiveTab] = useState(0)
    const [newImages, setNewImages] = useState([])

    
    async function getAttachments() {

        let attachments = await window.Sao.Window.Attachment.get_attachments_uri(props.record)

        attachments = attachments.filter(function (att) {
            
            return validateFileType(att[0], props.options.type)

        })

        setAttachs(attachments)
    }

    useEffect(() => {
        getAttachments()


    }, [props.record]);

    const AttachItem = (item) => {
        return (
            <div style={{ backgroundColor: activeItem && item[1].id === activeItem[1].id ? 'rgba(0, 0, 0, 0.1)' : 'inherit' }} onClick={(e) => { onItemClick(item) }} className="image-picker-item" key={item[1].id}>
                {item[0]}
            </div>
        )
    }

    const ImageThumb = (props) => {
        
        return (
            <img style={{ border: '1px solid rgba(0, 0, 0, 0.3)', marginLeft: '3px' }}  src={props.value.img} width="100" height="100" />
        )
    }

    function onItemClick(item) {

        if (activeItem && activeItem[1].id === item[1].id) {
            setActiveItem(false)
            getImage(false)

        }
        else {
            setActiveItem(item)
            getImage(item)
        }

    }

    async function getImage(attach) {
        let file;
        let name = attach[0];

        if (!attach) {
            setPreview(false)
            return false;
        }

        if (typeof attach[1] === 'string') {
            file = attach[1]
            return { title: name, value: file }
        }
        else {
            let url;
            if(props.options.type === "style"){
                return 
            }
            else{
                file = await window.Sao.Window.Attachment.open_data_uri(attach[1], props.record.get_context(), props.record.model.session)

                url = window.URL.createObjectURL(file)

                setPreview(url)
            }

           
           




        }
    }

    function insertImage() {
        let image = false;
        if (activeItem) {
            image = {
                title: activeItem[0],
                url: preview,
                id: activeItem[1].id
            }
        }
        props.callback(image, newImages, props.options.type)

    }




    function handleFiles(files) {
        
        let new_images = [...newImages]


        Object.keys(files).map(function (file) {


            if (validateFileType(files[file].name, props.options.type)) {
                new_images.push(readFile(files[file]));
            }

        })

        Promise.all(new_images).then(function (images) {

            setNewImages(images)



        })

    }


    return (

        <Modal
            open={props.open}
            onClose={props.close}
            center
            blockScroll={false}
            showCloseIcon={false}

            classNames={{
                overlay: "cm-modal-overlay",
                modal: "image-picker-modal",
            }}>
            <div className="modal-title">{props.options.type === 'img'? 'Add Image':'Add Stylesheet'}</div>
            {props.record.id > 0 ?
                <>
                    <div className="tab-domain-container">
                        <span onClick={() => { setActiveTab(0) }} className={activeTab === 0 ? "tab-domain-content tab-domain-active" : "tab-domain-content"}> Galería</span>
                        {props.options.type === 'img' &&
                             <span onClick={() => { setActiveTab(1) }} className={activeTab === 1 ? "tab-domain-content tab-domain-active" : "tab-domain-content"}> Subir </span>
                        }
                        
                    </div>


                    <div style={{ height: '300px' }} className="image-picker-container">
                        {activeTab === 0 ?
                            <>
                                <div className="image-picker-list">
                                    {attachs.map((value, index) => (
                                        AttachItem(value)
                                    ))}
                                </div>
                                {preview &&
                                    <div className="image-picker-preview-container">
                                        <img width={200} height={200} src={preview}></img>
                                    </div>
                                }
                            </>

                            :

                            <DropZone
                                className="image-picker-dropfile"
                                callback={handleFiles}>


                                {newImages.length > 0 ?
                                    <>
                                        {newImages.map((value, index) => (
                                            // <img style={{ border: '1px solid rgba(0, 0, 0, 0.3)', marginLeft: '3px' }} key={index} src={value.img} width="100" height="100" />
                                            // ImageThumb(index, value)
                                            <ImageThumb key={index} value={value}/>

                                        ))}
                                    </> :
                                    <div className="dropzone-placeholder">
                                        <label>
                                            <span style={{ cursor: 'pointer' }}>Drop images or click to search </span>
                                            <FontAwesomeIcon
                                                style={{ fontSize: "2em", marginLeft: '7px', marginTop: '5px', fontStyle: 'normal', cursor: 'pointer' }}

                                                icon={faCloudUploadAlt} />
                                            <input
                                                type="file"
                                                onChange={(e) => { handleFiles(e.target.files) }}
                                                multiple={true}
                                                // accept="image/*"
                                                accept={props.options.type === 'img' ? "image/*":".css"}
                                                id="upload"
                                                style={{ display: 'none' }} />
                                        </label>

                                    </div>


                                }


                            </DropZone>


                        }
                    </div>
                </>
                :
                <div style={{ height: '300px' }} className="image-picker-dropfile">
                    <h5 className="dropzone-placeholder">{check_record_saved}</h5>
                </div>

            }



            <div className="modal-buttons-container">

                <input type="button" style={{ backgroundColor: "#e7e7e7", color: "rgb(40,80,146)" }} onClick={(e) => { props.close() }} className="modal-buttons btn" value="Cancelar" />
                <input type="button" className="modal-buttons btn modal-button-primary" value="Confirmar" onClick={(e) => { insertImage() }} />
            </div>



        </Modal>
    )


}



function HtmlField(props) {
    const editorRef = useRef(null);
    const [states, setStates] = useState({})
    const [assetPickerDialog, setAssetPickerDialog] = useState({open:false});
    const [nodeReady, setNodeReady] = useState(false);
    const [editorReady, setEditorReady] = useState(false);
    const [stylesReady, setStylesReady] = useState(false);
    const [loadedStyles, setLoadedStyles] = useState([]);

    const default_config = {
        language: getLang(),
        height: props.sao_props.attributes.height || 500,
        menubar: true,
        // content_css:'/kalenis_views/tree_view/build/test.css, /kalenis_views/tree_view/build/test2.css',
        inline: false,
        browser_spellcheck: true,
        contextmenu:false,
        save_onsavecallback: () => { },
        menu: {
            file: { title: 'File', items: 'newdocument restoredraft | preview | print ' },
            edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
            view: { title: 'View', items: 'code | visualaid visualchars visualblocks | spellchecker | preview fullscreen' },
            insert: { title: 'Insert', items: 'tryton_image tryton_stylesheet | link media template codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor toc | insertdatetime' },
            format: { title: 'Format', items: 'italic bold underline strikethrough superscript subscript codeformat | formats blockformats fontformats fontsizes align | forecolor backcolor | removeformat' },
            tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
            table: { title: 'Table', items: 'inserttable | cell row column | tableprops deletetable' },
            help: { title: 'Help', items: 'help' }
        },
        plugins: [
            'advlist autolink lists link charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount importcss noneditable'
        ],
        noneditable_noneditable_class: "tryton_readonly",
        image_title: true,
        relative_urls: true,
        setup: (editor) => {
            setupEditor(editor)

        },
        toolbar:
            'fullscreen | save | tryton_add_stylesheet | tryton_add_image | undo redo | formatselect | bold italic backcolor | \
alignleft aligncenter alignright alignjustify | \
bullist numlist outdent indent | removeformat | help'
    }

    const [editorConfig, setEditorConfig] = useState(default_config)
    

    

    useEffect(() => {

        
        let value = getValue()
        
        if (editorRef.current && editorRef.current.editor && editorReady) {

            
            editorRef.current.editor.setContent(value)
            editorRef.current.editor.undoManager.reset()

            initAttachs()



        }

        //cleanup to prevent saveContent to be fired on unmount.
        //workaround for https://github.com/tinymce/tinymce-react/pull/118/commits/5efb8d7d7d68f32ee0958a4a4b61da80cb5e87c9
        return function cleanEditor() {
            if (editorRef.current && editorRef.current.editor) {


                editorRef.current.editor.off('SaveContent');
                

                

            }
        }
    }, [props.sao_props.value, editorReady]);


    useEffect(() => {

        if (props.sao_props.field) {

            evalStates()
        }

        if (!nodeReady) {
            let node = document.getElementById(props.element_id)
            if (node) {
                setNodeReady(true)
            }

        }


    });
    

   
    useEffect(() => {

      
      getImages();

    }, [stylesReady]);



    function evalStates() {

        var new_states = {}
        if (!props.sao_props.record) {
            return new_states;
        }
        var state_attrs = props.sao_props.field.get_state_attrs(props.sao_props.record);
        var readonly = props.sao_props.field.description.readonly;
        var required = props.sao_props.field.description.required;

        if (readonly === false) {
            if (state_attrs.readonly !== undefined) {
                readonly = state_attrs.readonly;

            }
        }

        if (required === false) {
            if (state_attrs.required !== undefined) {
                required = state_attrs.required;

            }
        }

        new_states['readonly'] = readonly;
        new_states['required'] = required;
        new_states['invalid'] = state_attrs.invalid

        if (new_states.invalid !== states.invalid
            || new_states.required !== states.required
            || new_states.readonly !== states.readonly) {

            setStates(new_states)
        }


    }


    function getValue() {
        let value = ""

        if (props.sao_props.record && props.sao_props.record._values[props.sao_props.field.description.name]) {
            value = props.sao_props.record._values[props.sao_props.field.description.name]
            
        }
       return value;
    }

    
    function saveContent(event, editor) {
        
        
        event.preventDefault()
        event.stopPropagation()

        if(editor){
            
            setRecord(editor)
        }
        
    }

    function handleEditorBlur(event, editor) {
   
        if (editor.isDirty()) {
            setRecord()
            
            // props.sao_props.field.set_client(props.sao_props.record, editor.getContent(), true)
        }


    }

    function setRecord(editor){
        
        if(!editor){
            editor = editorRef.current.editor
        }
        
        
        let body = editor.dom.getRoot()

        
        let ghost_body = body.cloneNode(true)

        let ghost_imgs = ghost_body.querySelectorAll('img')

        ghost_imgs.forEach(function(node, i){
            
            node.src = ""
        })

        
        props.sao_props.field.set_client(props.sao_props.record, ghost_body.innerHTML, true)
        editor.setDirty(false)
        
        
        
    }

 

    function getLang() {

        if (props.sao_props.record) {
            return props.sao_props.record.get_context().language
        }
        else {
            return 'en'
        }

    }



    function setupEditor(editor) {

        editor.ui.registry.addButton('tryton_add_image', {

            icon: 'image',
            onAction: function () {
                // Open window
                openAssetPicker('img');
            }
        });

       

        editor.ui.registry.addMenuItem('tryton_stylesheet', {
            text: 'Stylesheet',
            icon: 'document-properties',
            onAction: function () {
                // Open window
                openAssetPicker('style');
            }
        });

        // Adds a menu item, which can then be included in any menu via the menu/menubar configuration
        editor.ui.registry.addMenuItem('tryton_image', {
            text: 'Image',
            icon: 'image',
            onAction: function () {
                // Open window
                openAssetPicker('img');
            }
        });


    }

    function openAssetPicker(type) {
        let assetPicker = {}

        assetPicker.open = true;
        switch(type){
            case 'img':
                assetPicker.options ={type:'img'}
                break;
            case 'style':
                assetPicker.options ={type:'style'}
                break;
        }
        setAssetPickerDialog(assetPicker);
    }




    function createAttachment(file, type) {
        let values = {}

        let callback = function (value, name) {
            values.name = name
            values.data = value
            values.resource = [props.sao_props.record.model.name, props.sao_props.record.id]
            let model = new window.Sao.Model('ir.attachment')
            try {
                let id = model.execute('create', [[values]], props.sao_props.record.get_context(), false)[0];

                let asset = {}
                
                switch(type){
                    case 'img':{
                        asset = { id: id, url: file.img, title: name }
                        insertImage(asset)
                        break;
                    }
                       
                    case 'style':{
                        
                        asset = { id: id, url: window.URL.createObjectURL(file.file), title: name }
                        insertStyle(asset)
                        break;
                    }
                       

                }
                
                
                props.sao_props.screen.tab.refresh_resources(true)

            } catch (e) {
               
                return false
            }
        }

        window.Sao.common.get_file_data(file.file, callback)

    }

    function assetPickerCallback(attach, new_files, type) {

        
        if (attach) {

            if(type === 'style'){
                //parse id as string to prevent duplicate styles
                attach.id = attach.id.toString()
                insertStyle(attach)
            }
            else{
                insertImage(attach)
            }
            
        }

        if (new_files) {
            Object.keys(new_files).map(function (key) {
                createAttachment(new_files[key], type)
            })
        }

        setAssetPickerDialog({open:false});

    }


    function insertStyle(style) {
        
        let styles_container = editorRef.current.editor.$('#tryton_styles_container')
        
        if(!styles_container.length){
            
            let body = editorRef.current.editor.getBody()
            
            styles_container = editorRef.current.editor.dom.add(body, 'div', {style:"display:none;", id:"tryton_styles_container"}, '')
        }
        else {
            
            styles_container = styles_container[0]
        }
        
        
           
        let styled_div = editorRef.current.editor.dom.add(styles_container, 'div', {id:style.id, style:"display:none;"}, 'css_link')
        
        
        

        if(styled_div.id){
            addStylesheet([{id:style.id, url:style.url}])
        }
        
    }


    function insertImage(image) {
        var img = `<img id=${image.id} src=${image.url} title=${image.title} alt='Loading...' />`;
        editorRef.current.editor.insertContent(img)
    }

    function isStyleLoaded(id) {

        return loadedStyles.indexOf(id) >= 0
    }


   

    //styles=array of {id:int, url:url}
    function addStylesheet(styles, current_ids) {
        

        if (styles.length) {
            let newEditorConfig = { ...editorConfig }

            let newLoaded = [...loadedStyles]

            let content_css = ""

            if(newEditorConfig && newEditorConfig.content_css){
                content_css = newEditorConfig.content_css
            }

            if(current_ids){

                let new_styles = removeOldStyles(current_ids)

                if(new_styles){
                    content_css = new_styles.content_css
                    newLoaded = new_styles.new_loaded
                    
                }
                

            }
            
            
            styles.forEach(function (style) {

                if (isStyleLoaded(style.id) === false) {
                    
                    
                    newLoaded.push(style.id)


                    // newEditorConfig.content_css = newEditorConfig.content_css ? newEditorConfig.content_css.concat(',').concat(style.url) : style.url
                    newEditorConfig.content_css = content_css.concat(',').concat(style.url)


                }

            })

            setLoadedStyles(newLoaded);
            setEditorConfig(newEditorConfig)
            setEditorReady(false);
            setNodeReady(false);
            setStylesReady(true);
        } 

        

    }

    function removeOldStyles(current_ids){

        let currentLoaded = [...loadedStyles]
        let to_remove = currentLoaded.filter(function(old_style){
            return current_ids.indexOf(old_style) < 0
        })

        
        if(to_remove.length){
            if(editorConfig.content_css){

            let config_array = editorConfig.content_css.split(',')
    
            to_remove.forEach(function(id, index){
    
                config_array.splice(index, 1)
                currentLoaded.splice(currentLoaded.indexOf(id), 1)
                
            })
    
 
    
            return {content_css:config_array.join(), new_loaded:currentLoaded}
    
            }

        }
        else {
            return false
        }
        
        
        


    }

    

    function getImages(){
        if(stylesReady){
            
            editorRef.current.editor.$('img').each(async function (i, img) {
                if (img.id) {
                    
    
                    let file = await window.Sao.Window.Attachment.open_data_uri({ id: img.id }, props.sao_props.record.get_context(), props.sao_props.record.model.session)
                    let url = window.URL.createObjectURL(file)
    
                    
                    img.src = url
    
                }
            })


        }
    }

    

    function initAttachs() {
        

        let styles = []
        let current_ids = []
        let styles_container = editorRef.current.editor.dom.get('tryton_styles_container')
        
        if(styles_container){
           
            styles_container.childNodes.forEach(async function (i, val) {
                
                let div = styles_container.children[val]
                
                let getStyle = async function (div) {
                    if(!div.id){
                        return false
                    }
                    if(isStyleLoaded(div.id) === true){
                        return false
                    }
                    if (div.innerText === "css_link") {
                        
                        let file = await window.Sao.Window.Attachment.open_data_uri({ id: div.id }, props.sao_props.record.get_context(), props.sao_props.record.model.session)
                        let url = window.URL.createObjectURL(file)
                        return { id: div.id, url: url }
                    }
    
                }
    
                styles.push(getStyle(div))
                if(div.id){
                    current_ids.push(div.id)
                }
                
    
            })

          


            Promise.all(styles).then(function (solvedStyles) {
               
                
                let newStyles = solvedStyles.filter(function(style){return style != false && style != undefined})
    
                if(newStyles.length){
                    addStylesheet(newStyles, current_ids)
                }
                else{
                    if(!stylesReady){
                        setStylesReady(true);
                    }
                   
                }
                
               
            })

        }
        else{

            
            
            if(loadedStyles.length){
                setLoadedStyles([]);
                setEditorConfig(default_config)
                setEditorReady(false);
                setNodeReady(false);
                
            }
            if(!stylesReady){
                setStylesReady(true);
            }
         

        }
        


        getImages()


    }

    function handleEditorDropzone(e) {



        if (!e.dataTransfer.files.length) {

            return true;
        }
        else if (props.sao_props.record.id < 0) {
            e.preventDefault()
            props.sao_props.screen.tab.info_bar.message(
                check_record_saved, 'danger');
            return true;
        }
        else {
            e.preventDefault()
            let files = e.dataTransfer.files
            let new_images = []

            Object.keys(files).map(function (file) {
                if (isImage(files[file].name)) {
                    new_images.push(readFile(files[file]));
                }


            })

            Promise.all(new_images).then(function (images) {

                assetPickerCallback(false, images, 'img')



            })

        }


    }
    


    

    return (
        <React.Fragment>
            {nodeReady &&
                <div style={{ border: states.invalid ? "1px solid red" : "none" }}>
                    <Editor
                        initialValue={getValue()}
                        ref={editorRef}
                        tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
                        disabled={states.readonly}
                        inline={states.readonly}
                        onInit={() => { setEditorReady(true) }}
                        onDrop={handleEditorDropzone}
                        init={editorConfig}
                        onBlur={handleEditorBlur}
                        onSaveContent={saveContent}
                        
                        
                    />

                </div>
            }


            {assetPickerDialog.open &&
                <AssetPicker
                    open={assetPickerDialog.open}
                    options={assetPickerDialog.options}
                    record={props.sao_props.record}
                    close={() => { setAssetPickerDialog({open:false}) }}
                    callback={assetPickerCallback}
                />
            }


        </React.Fragment>
    )

}

export default HtmlField;