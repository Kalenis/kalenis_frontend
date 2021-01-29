
const Post = async ( method, params, session ) => {

    let auth = session.get_auth()
    
    params.push(session.context)
    
    let body = JSON.stringify({
        id: window.parent.Sao.rpc.id++,
        method: method,
        params: params,
    })

    let response = await fetch("/" + session.database + "/", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Session ' + auth
      },
      mode: 'cors',
      body: body,
    })

    let res = await response.json()
    

    return res;

}

// const Get = async ( path ) => {

//     var body_req = JSON.stringify(body)
    
//         let response = await fetch(Config.API_URL.concat(path), {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           mode: 'cors',
//           body: body_req,
//         })
    
//         let res = await response.json()
       
    
//         return res;
    
//     }

const ws = {
  Post:Post,
//   Get:Get
}
export default ws