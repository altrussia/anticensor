import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import * as converter from './convert.js'


function allChildren(elem, elem_type) {
  let result = []
  let children = Array.from(elem.children)

  for (let child of children) {
    if (child instanceof elem_type) {
      result.push(child)
    } else {
      let subs = allChildren(child, elem_type)
      result = [...result, ...subs]
    }
  }

  return result
}


class InputWidget extends LitElement {
  static properties = {
    value: {
      state: true
    },
    field: {
      state: true
    }
  };

  constructor() {
    super();
    this.value = ''
  }

  onchange(evt) {
    this.value = evt.target.value
    if (this.field) {
      this.field.set_value(this.value)
    }
  }
}


class Selector extends InputWidget {
  static _name = "sub-selector"

  static styles = css`
  select {
    width: 100%;
  }
  `
  
  render() {
    let options = []

    for (let option of converter.get_dictionaries()) {
      if (option == this.choice) {
        options.push(html`<option selected="selected" value="${option}>${option}</option>`)
      } else {
        options.push(html`<option value="${option}">${option}</option>`)
      }
    }

    return html`<select @change=${(evt) => this.onchange(evt)}>
      <option></option>
      ${options}
    </select>`
  }
}

class TextInput extends InputWidget {
  static _name = "text-input"

  static styles = css`
  :host() {
    width: 100%;
  }

  textarea {
    width: 100%;
    height: 10rem;
    max-width: 100%;
    box-sizing: border-box;
  }
  `

  render() {
    return html`<textarea @input=${(evt) => this.onchange(evt)}>${this.value}</textarea>`
  }
}


class TagInput extends InputWidget {
  static _name = 'tag-input'

  static styles = css`
    :host > div {
      display: flex;
      flex-wrap: wrap;
    }

    :host > div > span {
      flex: 1;
      border: 1px solid black;
      margin: 2px;
      text-align: center;
      padding: 2px;
      cursor: pointer;
    }

    :host > div > span:hover {
      background-color: rgb(200, 200, 200);
    }
  `

  static properties = {
    ...InputWidget,
    dictionnary: {
      state: true,
      type: String
    }
  }

  get words() {
    let dict = ''

    if (this.field && this.field.view) {
      dict = this.field.view.values[this.dictionnary] || ''
    }

    return converter.get_dictionnary(dict) || []
  }

  get label() {
    return `${this.field.label} (${this.words.length})`
  }

  constructor() {
    super();
    this.dictionnary = this.getAttribute('dictionnary')
  }

  render() {
    let words = this.words
    words.sort()

    return html`
      <div>
        ${words.map((word) => html`<span>${word}</span> `)}
      </div>
    `
  }

}

class Converter extends InputWidget {
  static _name = 'text-converter'

  static styles = TextInput.styles

  static properties = {
    ...InputWidget,
    source: {
      state: true,
      type: String
    },
    dictionnary: {
      state: true,
      type: String
    }
  }

  constructor() {
    super();
    this.dictionnary = this.getAttribute('dictionnary')
    this.source = this.getAttribute('source')
  }

  render() {
    let dict = ''
    let text = ''

    if (this.field && this.field.view) {
      dict = this.field.view.values[this.dictionnary]
      text = this.field.view.values[this.source] || ''
    }

    let output = converter.convert(text, converter.get_dictionnary(dict) || [])

    return html`
      <div>
       <textarea>${output}</textarea>
     </div>
    `
  }
}

function findParent(current, tagname) {
  let next = null
  if (current.parentNode && current.parentNode.tagName) {
    next = current.parentNode
  } else if (current.parentNode.host) {
    next = current.parentNode.host
  }

  if (!next) {
    return null
  }

  if (next.tagName == tagname) {
    return next
  }

  return findParent(next, tagname)
}

class FormField extends LitElement {
  static _name = 'form-field'

  static styles = css`
  :host {
    display: block;
  }

  :host label {
    font-weight: bold;
    font-size: 1.1rem;
  }
  `

  static properties = {
    widget: {
      state: true
    },
    name: {
      state: true,
      type: String,
      attribute: true
    },
    label: {
      state: true,
      type: String,
      attribute: true
    },
    view: {
      state: true
    },
    value: {
      state: true
    }
  }

  connectedCallback() {
    super.connectedCallback()
    let view = findParent(this, 'FORM-VIEW')
    if (view instanceof FormView) {
      this.view = view
      this.view.register(this)
    }
    console.log("Connected")
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.view) {
      this.view.unregister(this)
      this.view = null
    }
    console.log('Disconnected')
  }

  constructor() {
    super();
    this.widget = Array.from(this.children)[0]
    this.name = this.getAttribute('name')
    this.label = this.getAttribute('label')
    if (this.widget) {
      this.widget.field = this
    }
  }

  set_value(val) {
    if (this.view) {
      this.view.set_value(this.name, val)
    }
  }

  render() {
    if (this.widget) {
      this.widget.requestUpdate()
    }

    let label = this.widget.label || this.label

    return html`
    <label>${label}</label>
    <div>
      ${this.widget}
    </div>`
  }
}

class FormView extends LitElement {
  static _name = 'form-view'

  static styles = css`
  form-field  {
    margin-bottom: 1rem;
  }
  `

  static properties = {
    elements: {
      state: true
    },
    fields: {
      state: true
    }
  };

  constructor() {
    super();
    this.elements = Array.from(this.childNodes)
    this.fields = []
    this.values = {}
  }


  set_value(field, val) {
    this.values[field] = val

    for (let field of this.fields) {
      field.requestUpdate()
    }

    /*
    for (let field of this.fields) {
      field.refresh_state()
    }
    */
  }

  render() {
    return html`<div>${this.elements}</div>`
  }

  register(field) {
    if(this.fields.indexOf(field) < 0) {
      this.fields.push(field)
    }
  }

  unregister(field) {
    if(this.fields.indexOf(field) >= 0) {
      this.fields.splice(this.fields.indexOf(field), 1)
    }
  }
}

let widgets = []

widgets.push(Selector)
widgets.push(TextInput)
widgets.push(FormField)
widgets.push(FormView)
widgets.push(TagInput)
widgets.push(Converter)
// widgets.push(Converter)

for (let widget of widgets) {
  customElements.define(widget._name, widget)
}
