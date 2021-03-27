import { css, customElement, html, LitElement, property, query, queryAll } from "lit-element";
import '@material/mwc-textfield'
import '@material/mwc-icon-button'
import { TextField } from "@material/mwc-textfield";
import '@material/mwc-circular-progress'
import availablePairs from './pairs.json'
import '@material/mwc-snackbar'
import { Snackbar } from "@material/mwc-snackbar";


declare module cryptowatch {
  class Embed {
    constructor(exchange: string, pair: string, options: Object);
    mount(target: string | HTMLElement): void;
  }
};

@customElement('crypto-embeds')
export class CryptoEmbeds extends LitElement {
  timePeriod = '1h';

  pairs: string[] = localStorage.getItem('pairs') ? JSON.parse(localStorage.getItem('pairs')!) : []

  availablePairs = []

  @query('mwc-textfield') input!: TextField;
  @queryAll('.embed') embeds!: HTMLDivElement[];

  q (sel: string) {
    return this.shadowRoot!.querySelector(sel);
  }

  constructor() {
    super();
  }

  static styles = css`
  .embed-frame {
    width: calc(100% / 2);
    height: 500px;
    padding: 1px;
    box-sizing: border-box;
    background-color: grey;
    position: relative;
  }
  .embed-frame > .tag {
    position: absolute;
    top: 0;
    right: 0;
    background-color: white;
    color: black;
    font-size: 20px;
    padding: 2px 6px;
  }
  .embed-frame > mwc-circular-progress {
    position: absolute;
    left: 40%;
    top: 40%;
  }
  `

  render() {
    return html`
    <div id="container">
      <div style="display:flex;align-items:center">
        <mwc-textfield label="pair" style="flex:1"
            helper="ex: xrpeur, xrpeur-binance, etheur-kraken, ..."
            helperPersistent
            @change="${this.addPair}"></mwc-textfield>
        <!-- <mwc-icon-button icon="add"
            @click="${this.addPair}"></mwc-icon-button> -->
      </div>
      <div style="display:flex;flex-wrap:wrap">
      ${this.pairs.map((p) => {
        return html`
        <div class="embed-frame">
          <div class="tag">${this.formatValue(p)['pair'].replace('EUR', '').replace('USD', '')}</div>
          <div class="embed" id="_${p}" style="height:100%"></div>
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>`;
      })}
      </div>
    </div>

    <mwc-snackbar leading></mwc-snackbar>
    `
  }

  async addPair () {
    if (!this.input.value) {
      this.toast('enter a value')
      return
    }
    let { pair, exchange } = this.formatValue(this.input.value)
    const availableExchanges = availablePairs.filter(o => o.pairs.includes(pair)).map(o => o.exchange)
    if (!availableExchanges.length || (exchange && !availableExchanges.includes(exchange))) {
      this.toast('this pair is not available')
      return
    }
    if (!exchange) {
      // taking the first available exchange
      exchange = availableExchanges[0]
      this.input.value += `-${exchange}`
    }
    this.pairs.push(this.input.value)
    this.requestUpdate()
    await this.updateComplete
    this.fillEmbed(this.input.value)
    this.input.value = '';
    setTimeout(() => this.shutAllCircularProgress(), 5000)
  }

  formatValue (inputValue: string) {
    let pair = inputValue
    let exchange = undefined;
    if (inputValue.indexOf('-')) {
      exchange = inputValue.split('-')[1]
      pair = inputValue.split('-')[0]
    }
    return { pair, exchange }
  }

  fillEmbed(inputValue: string) {
    console.log('alo?')
    const { pair, exchange } = this.formatValue(inputValue)
    const chart = new cryptowatch.Embed(exchange!, pair, {
      timePeriod: this.timePeriod,
      presetColorScheme: 'ishihara'
    })
    chart.mount(this.shadowRoot!.querySelector<HTMLElement>(`[id=_${inputValue}]`)!)
  }

  shutAllCircularProgress () {
    this.shadowRoot!.querySelectorAll('mwc-circular-progress').forEach(el => {
      el.indeterminate = false;
    })
  }

  toast (message: string) {
    const snack = <Snackbar>this.q('mwc-snackbar')
    snack.labelText = message;
    snack.show()
  }
}
