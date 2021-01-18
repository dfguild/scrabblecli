import { Socket, SocketIoConfig } from 'ngx-socket-io'
import { environment } from 'src/environments/environment';

export class AuthSocket extends Socket{

  constructor(token: string) {
    super({ url: environment.apiUrl, options: {
      query: `token=${token}`
    }});
  }
}
