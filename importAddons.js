//TODO: Import css files ¿pasar los import al html raiz ?

//Array de paths a los asset-manifest.json de cada addon
// const Addons = ['addons/tree_view/build/asset-manifest.json']
// const Addons = ['addons/tree_view/build', 'addons/gamification/build']
const Addons = 'kalenis_views/tree_view/build'

window.Sao = {}

var readAddon = async function(file, path){
    if(file.endsWith('.css')===true){
        //adding css style for production
        var new_css = $('<link rel="stylesheet" type="text/css" />')
        new_css.attr('href', file)
        var new_css = $('head').append(new_css)
        return true
        
    }
    console.log("FILE ON LOOP");
    console.log(file);
    if(file.endsWith('.js')===false ){
        return true
    }

    var moduleSpecifier;
    if(file.startsWith('kalenis_views')){
        //Prod Build
        moduleSpecifier=  '/'+file
    }
    else{
        //dev Build
        moduleSpecifier = '/'+path+file
    }
    

    console.log("IMPORT MODULE FOR LOOP")
    console.log(file)
    return import(moduleSpecifier)
}

var getPaths = async function(){
    
    let response = await fetch(Addons+'/asset-manifest.json')
    return response.json()

}

var readAddons = async function(){
    console.log("IMPORTING ADDONS")
    let prms = []
    let paths = await getPaths()
    Object.values(paths.files).forEach(function(file){
        prms.push(readAddon(file, Addons))
    })

    return prms
// console.log("PRMS INSIDE METHOD")
// console.log(prms)
// console.log("END : IMPORTING ADDONS")
// return prms

}().then(function(prms){
    console.log("PRMS AFTER RETURN")
    console.log(prms)
    Promise.all(prms).then(function(prms){
        console.log("ADDING SAO....")
        let sao_tag = document.createElement("script");
        sao_tag.setAttribute("src", "/dist/tryton-sao.min.js");
        document.head.appendChild(sao_tag);
        // let custom_js_tag = document.createElement('script')
        // custom_js_tag.setAttribute("src","/custom.js")
        // document.head.appendChild(custom_js_tag)

    })
})






