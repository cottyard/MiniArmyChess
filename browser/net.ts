type CallBack = (res: string) => void
type ErrorCallBack = () => void

const timeout_threshold: number = 8000

export class Net
{
    static remote_post(url: string, data: string, next: CallBack, fail: ErrorCallBack, timeout: ErrorCallBack): void
    {
        let req = new XMLHttpRequest()
        req.open('POST', `${ url }`)
        req.timeout = timeout_threshold

        req.onreadystatechange = () =>{
            if (req.readyState == req.DONE){
                if (req.status == 200){
                    next(req.responseText)
                } else {
                    fail()
                }
            }
        }

        req.onerror = () =>{
            console.log('post error:', url)
            fail()
        }

        req.ontimeout = () =>{
            console.log('post timeout:', url)
            timeout()
        }

        req.send(data)
    }
    
    static remote_get(url: string, next: CallBack, fail: ErrorCallBack, timeout: ErrorCallBack): void
    {
        let req = new XMLHttpRequest()
        req.open('GET', `${ url }`)
        req.timeout = timeout_threshold
    
        req.onreadystatechange = () =>{
            if (req.readyState == req.DONE){
                if (req.status == 200){
                    next(req.responseText)
                } else {
                    fail()
                }
            }
        }
    
        req.onerror = () =>{
            console.log('get error:', url)
            fail()
        }
    
        req.ontimeout = () =>{
            console.log('get timeout:', url)
            timeout()
        }
    
        req.send()
    }
    
    static query_hall(name: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_get(`hall/${name}`, next, fail, fail)
    }

    static send_challenge(name: string, other: string, layout: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_post(`hall/${name}/challenge?user=${other}`, layout, next, fail, fail)
    }

    static accept_challenge(name: string, other: string, layout: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_post(`hall/${name}/accept?user=${other}`, layout, next, fail, fail)
    }

    static watch(other: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_post(`hall/watch/${other}`, '', next, fail, fail)
    }

    static get_session(id: string, name: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_get(`session/${id}?user=${name}`, next, fail, ()=>{})
    }

    static get_game(id: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_get(`session/${id}/game`, next, fail, ()=>{})
    }

    static submit_move(
        session: string,
        name: string,
        move: string, 
        milliseconds_consumed: number, 
        next: CallBack,
        fail: ErrorCallBack)
    {
        this.remote_post(
            `session/${session}/game?user=${name}&time=${milliseconds_consumed}`,
            move,
            next, 
            fail,
            ()=>{
                console.log('submit timeout')
            })
    }
}