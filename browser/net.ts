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
    
    static query_hall(user: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_get(`hall/${user}`, next, fail, fail)
    }

    static send_challenge(user: string, other: string, layout: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_post(`hall/${user}/challenge?user=${other}`, layout, next, fail, fail)
    }

    static accept_challenge(user: string, other: string, layout: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_post(`hall/${user}/accept?user=${other}`, layout, next, fail, fail)
    }

    static get_session(id: string, user: string, player_name: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_get(`session/${id}?user=${user}&player=${player_name}`, next, fail, ()=>{})
    }

    static get_game(id: string, next: CallBack, fail: ErrorCallBack) {
        this.remote_get(`session/${id}/game`, next, fail, ()=>{})
    }

    static submit_move(
        session: string,
        user: string,
        move: string, 
        milliseconds_consumed: number, 
        next: CallBack,
        fail: ErrorCallBack)
    {
        this.remote_post(
            `session/${session}/game?user=${user}&time=${milliseconds_consumed}`,
            move,
            next, 
            fail,
            ()=>{
                console.log('submit timeout')
            })
    }
}