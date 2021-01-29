//TODO: Import css files ¿pasar los import al html raiz ?

//Array de paths a los asset-manifest.json de cada addon
// const Addons = ['addons/tree_view/build/asset-manifest.json']
// const Addons = ['addons/tree_view/build', 'addons/gamification/build']
const Addons = ['kalenis_views/tree_view/build']


var readAddons = async function(){
    Addons.map(async function(path){
        fetch(path+'/asset-manifest.json')
        .then(response => {
            return response.json()
        })
        .then(data => {
            
            
            Object.values(data.files).map(async function(file){
                
                if(file.endsWith('.css')===true){
                    //adding css style for production
                    var new_css = $('<link rel="stylesheet" type="text/css" />')
                    new_css.attr('href', file)
                    var new_css = $('head').append(new_css)
                    return true
                    
                }

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



                //cra watch

                // const moduleSpecifier = '/'+path+file
                
                

                //Prod build
                // const moduleSpecifier = '/'+file

                


                await import(moduleSpecifier)

                
            })
        })

        })
}()






