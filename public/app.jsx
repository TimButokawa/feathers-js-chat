const PLACEHOLDER = 'https://placeimg.com/60/60/people';
const socket = io();

const dummyUser = {
  avatar: PLACEHOLDER,
  email: 'Foo'
};

const app = feathers()
  .configure(feathers.socketio(socket))
  .configure(feathers.hooks())
  .configure(feathers.authentication({
      storage: window.localStorage
  }));

const ComposeMessage = React.createClass({
  getInitialState() {
    return { text: '' };
  },
  updateText(ev) {
    this.setState({ text: ev.target.value });
  },
  sendMessage(ev) {
    app.service('messages').create(this.state)
      .then(() => this.setState({ text: '' }))
    ev.preventDefault()
  },
  render() {
    return (
      <form className="flex flex-row flex-space-between" onSubmit={this.sendMessage}>
        <input type="text" name="text" className="flex flex-1"
          value={this.state.text} onChange={this.updateText} />
        <button className="button-primary" type="submit">Send</button>
      </form>
    );
  }
});

const UserList = React.createClass({
  logout() {
    app.logout().then(() => window.location.href = '/login.html');
  },
  renderUserItem(user) {
    return (
      <li>
        <a className="block relative" href="#">
          <img src={user.avatar || PLACEHOLDER} className="avatar" />
          <span className="absolute username">{user.email}</span>
        </a>
      </li>
    );
  },
  render() {
    const users = this.props.users;
    return (
        <aside className="sidebar col col-3 flex flex-column flex-space-between">
          <header className="flex flex-row flex-center">
            <h4 className="font-300 text-center">
              <span className="font-600 online-count">{users.length}</span> users
            </h4>
          </header>

          <ul className="flex flex-column flex-1 list-unstyled user-list">
            {users.map(user =>
              this.renderUserItem(user)
            )}
          </ul>
          <footer className="flex flex-row flex-center">
            <a href="#" className="logout button button-primary" onClick={this.logout}>Sign Out</a>
          </footer>
        </aside>
    );
  }
});

const MessageList = React.createClass({
  renderMessage(message) {
    const sender = message.sentBy || dummyUser;
    return (
      <div>
        <img
          className="avatar"
          src={sender.avatar || PLACEHOLDER}
          alt={sender.email} />
        <div
          className="message-wrapper">
          <p
            className="message-header">
            <span
              className="username font-600">{sender.email}</span>
            <span
              className="sent-date font-300">
              {moment(message.createdAt).format('MMM Do, hh:mm:ss')}
            </span>
          </p>
          <p
            className="message-content font-300">
            {message.text}
          </p>
        </div>
      </div>
    );
  },
  render() {
    return (
      <main
        className="chat flex flex-column flex-1 clear">
        {this.props.messages.map(this.renderMessage)}
      </main>
    );
  }
});

const ChatApp = React.createClass({
  getInitialState() {
    return {
      users: [],
      messages: []
    };
  },
  componentDidUpdate: function() {
    const node = this.getDOMNode().querySelector('.chat');
    node.scrollTop = node.scrollHeight - node.clientHeight;
  },
  componentDidMount() {
    const userService = app.service('users');
    const messageService = app.service('messages');

    userService.find().then(page => this.setState({ users: page.data }));

    userService.on('created', user => this.setState({
      users: this.state.users.concat(user)
    }));

    messageService.find({
      query: {
        $sort: { createdAt: 1 },
        $limit: this.props.limit || 10
      }
    }).then(page => this.setState({ messages: page.data.reverse() }));

    messageService.on('created', message => this.setState({
      messages: this.state.messages.concat(message)
    }));
  },
  render() {
    return (
      <div
        className="flex flex-row flex-1 clear">
        <UserList
          users={this.state.users}></UserList>
        <div
          className="flex flex-column col col-9">
          <MessageList
            users={this.state.users}
            messages={this.state.messages}></MessageList>
          <ComposeMessage></ComposeMessage>
        </div>
      </div>
    );
  }
});

const App = () => {
  return (
    <div id="app" className="flex flex-column">
      <header className="title-bar flex flex-row flex-center">
        <div className="title-wrapper block center-element">
          <img className="logo" src="http://feathersjs.com/img/feathers-logo-wide.png" alt="Feathers Logo" />
          <span className="title">Chat</span>
        </div>
      </header>
      <ChatApp />
    </div>
);
}

app.authenticate().then(() => {
  ReactDOM.render(<App />, document.body)
}).catch(error => {
  if(error.code === 401) {
    window.location.href = '/login.html'
  }

  console.error(error)
});
