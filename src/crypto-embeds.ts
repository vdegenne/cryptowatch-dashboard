import { css, customElement, html, LitElement, property, query, queryAll } from "lit-element";
import '@material/mwc-textfield'
import '@material/mwc-icon-button'
import { TextField } from "@material/mwc-textfield";
import '@material/mwc-circular-progress'
import availablePairs from './pairs.json'
import '@material/mwc-snackbar'
import { Snackbar } from "@material/mwc-snackbar";
import '@material/mwc-slider'
import { Slider } from "@material/mwc-slider";
import '@material/mwc-icon'


declare module cryptowatch {
  class Embed {
    constructor(exchange: string, pair: string, options: Object);
    mount(target: string | HTMLElement): void;
  }
};

@customElement('crypto-embeds')
export class CryptoEmbeds extends LitElement {
  timePeriod = '1h';

  pairs: string[] = [];

  availablePairs = []

  @property({type:Number})
  private division = localStorage.getItem('dashboard:division') ? parseInt(localStorage.getItem('dashboard:division')!) : 2;

  @query('mwc-textfield') input!: TextField;
  @query('mwc-snackbar') snackbar!: Snackbar;
  @queryAll('.embed') embeds!: HTMLDivElement[];

  q (sel: string) {
    return this.shadowRoot!.querySelector(sel);
  }

  constructor() {
    super();
  }

  static styles = css`
  .embed-frame {
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
  .embed-frame > .delete-button {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #f44336;
    color: white;
    cursor: pointer;
    padding: 4px;
  }
  .embed-frame > .delete-button > mwc-icon {
    display: block;
  }
  .embed-frame > mwc-circular-progress {
    position: absolute;
    left: 40%;
    top: 40%;
  }
  `

  render() {
    return html`
    <style>
      .embed-frame {
        width: calc(100% / ${this.division});
      }
    </style>
    <div id="container">
      <div style="display:flex;flex-wrap:wrap">
      ${this.pairs.map((p) => {
        return html`
        <div class="embed-frame">
          <div class="tag">${this.formatValue(p)['pair'].replace('EUR', '').replace('USD', '')}</div>
          <div class="embed" id="_${p}" style="height:100%"></div>
          <mwc-circular-progress indeterminate></mwc-circular-progress>
          <div class="delete-button"
            @click="${() => this.deletePair(p)}">
            <mwc-icon>delete</mwc-icon>
          </div>
        </div>`;
      })}
      </div>
    </div>

    <div style="display:flex;align-items:center">
      <mwc-textfield label="pair" style="flex:1"
          helper="ex: xrpeur, xrpeur-binance, etheur-kraken, ..."
          @change="${this.addPair}"></mwc-textfield>
      <!-- <mwc-icon-button icon="add"
          @click="${this.addPair}"></mwc-icon-button> -->
    </div>

    <mwc-slider min="1" step="1" max="4" markers pin
      style="width:100%;padding:24px;box-sizing:border-box"
      value="${this.division}"
      @change="${(e: Event) => this.onSliderChange(e)}"></mwc-slider>

    <mwc-snackbar leading></mwc-snackbar>
    `
  }
  deletePair(pair: string) {
    this.pairs.splice(this.pairs.indexOf(pair), 1)
    this.requestUpdate()
    this.save()
  }
  private onSliderChange(e: Event) {
    console.log(e)
    this.division = (e.target as Slider).value;
    localStorage.setItem('dashboard:division', this.division.toString())
  }

  async firstUpdated() {
    const pairs = localStorage.getItem('dashboard:pairs') ? JSON.parse(localStorage.getItem('dashboard:pairs')!) : []
    if (pairs.length) {
      this.toast('loading charts, please wait... (slow to avoid cryptowatch rate limit ban)', -1)
      for (const pair of pairs) {
        this.pairs.push(pair)
        this.requestUpdate()
        await this.updateComplete
        this.fillEmbed(pair)
        await new Promise(resolve => setTimeout(resolve, 2000))
        setTimeout(() => this.shutAllCircularProgress(), 2000)
      }
      this.snackbar.close()
    }
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
    this.save()
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

  toast (message: string, timeoutMs: number = 5000) {
    const snack = <Snackbar>this.q('mwc-snackbar')
    snack.labelText = message;
    snack.timeoutMs = timeoutMs;
    snack.show()
  }

  save () {
    localStorage.setItem('dashboard:pairs', JSON.stringify(this.pairs))
  }
}
