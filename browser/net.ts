type CallBack = (res: string) => void
type TimeoutCallBack = () => void

const timeout = 8000

export class Net
{
    static remote_post(url: string, data: string, next: CallBack, fail: TimeoutCallBack): void
    {
        let req = new XMLHttpRequest()
        req.open('POST', `${ url }`)
        req.timeout = timeout

        req.onreadystatechange = () =>{
            if (req.readyState == req.DONE){
                if (req.status == 200){
                    next(req.responseText)
                }
            }
        }

        req.onerror = () =>{
            console.log('post error:', url)
            fail()
        }

        req.ontimeout = () =>{
            console.log('post timeout:', url)
            fail()
        }

        req.send(data)
    }
    
    static remote_get(url: string, next: CallBack, fail: TimeoutCallBack): void
    {
        let req = new XMLHttpRequest()
        req.open('GET', `${ url }`)
        req.timeout = timeout
    
        req.onreadystatechange = () =>{
            if (req.readyState == req.DONE){
                if (req.status == 200){
                    next(req.responseText)
                }
            }
        }
    
        req.onerror = () =>{
            console.log('get error:', url)
            fail()
        }
    
        req.ontimeout = () =>{
            console.log('get timeout:', url)
            fail()
        }
    
        req.send()
    }
    
    static query_hall(name: string, next: CallBack, fail: TimeoutCallBack) {
        this.remote_get(`hall/${name}`, next, fail)
    }

    static send_challenge(name: string, other: string, layout: string, next: CallBack, fail: TimeoutCallBack) {
        this.remote_post(`hall/${name}/challenge?user=${other}`, layout, next, fail)
    }

    static accept_challenge(name: string, other: string, layout: string, next: CallBack, fail: TimeoutCallBack) {
        this.remote_post(`hall/${name}/challenge/accept?user=${other}`, layout, next, fail)
    }

    static watch(name: string, other: string, next: CallBack, fail: TimeoutCallBack) {
        this.remote_post(`hall/${name}/watch?user=${other}`, '', next, fail)
    }

    static get_session(id: string, name: string, next: CallBack, fail: TimeoutCallBack) {
        this.remote_get(`session/${id}?user=${name}`, next, fail)
    }

    static get_game(id: string, next: CallBack, fail: TimeoutCallBack) {
        this.remote_get(`session/${id}/game`, next, fail)
    }

    static submit_move(
        session: string,
        name: string,
        move: string, 
        milliseconds_consumed: number, 
        next: CallBack,
        fail: TimeoutCallBack)
    {
        this.remote_post(
            `session/${session}/game?user=${name}&time=${milliseconds_consumed}`,
            move,
            next, 
            fail)
    }
}