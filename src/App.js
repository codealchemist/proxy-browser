import React, { useState, useEffect } from 'react';
import PrettyJSON from 'react-prettify-json'
import './App.css';
import WebSocketClient from './services/websocket'
import Peer from './services/webrtc'
import { select } from 'async';

const ws = new WebSocketClient()
const peer = new Peer()
window.ws = ws

// ws.connect('wss://proxy-lady.openode.io:443')
ws.connect('wss://proxy-lady.herokuapp.com:443')
ws.onMessage(message => {
  peer.signal(message)
})

peer.onSignal(signal => {
  ws.send(signal)
})

function App() {
  const [log, setLog] = useState([])
  const [status, setStatus] = useState('connecting')
  const [selected, setSelected] = useState()

  useEffect(() => {
    peer.onData(data => {
      const message = data.toString('utf-8')
      setLog([...log, message])
    })
  }, [log])

  function select(index) {
    // Unselect.
    if (selected?.index === index) {
      setSelected(null)
      return
    }

    // Select.
    const message = log[index]
    setSelected({ index, message })

  }

  function getSectionClass(index) {
    let className = ''
    if (selected?.index === index) className = 'selected'
    return className
  }

  function syntaxHighlight(json) {
    if (typeof json != 'string') {
      json = JSON.stringify(json, undefined, 2)
    } else {
      const obj = JSON.parse(json)
      json = JSON.stringify(obj, null, 2)
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
            cls = 'key';
        } else {
            cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }

      return '<div class="' + cls + '">' + match + '</div>'
    });
}

  return (
    <div className="App">
      <header>
        proxy browser
      </header>
      <content>
        {log.map((line, index) => (
          <section key={index} className={getSectionClass(index)}>
            <pre className="truncate" onClick={() => select(index)}>
              <i>{index}</i> {line}
            </pre>
          </section>
        ))}
      </content>
      {selected?.message && (
        <article>
          <PrettyJSON
            jsonObject={JSON.parse(selected.message)}
            colors={{
              punctuation: '#757575',
              key: '#61dafb',
              value: '#49cabe',
              string: '#adad42'
            }}
          />
        </article>
        // <article dangerouslySetInnerHTML={{__html: syntaxHighlight(selected.message)}}></article>
      )}
    </div>
  );
}

export default App;
