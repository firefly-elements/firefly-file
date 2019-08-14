import { PolymerElement,html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-fab/paper-fab.js';

import '@firefly-elements/polymerfire/firebase-auth';
import '@firefly-elements/polymerfire/firebase-storage-multiupload';
import '@firefly-elements/polymerfire/firebase-storage-upload-task';

import './firefly-icons/firefly-icons.js'



/**
 * `firefly-file` This component is responsible for loading a single file into the
 * specified file storage location. To add it to your page, set the 'app-name' and
 * 'path' attributes. Then add a 'file-upload-complete' listener to the containing page.
 * This listener can extract the download URL from the event.detail.downloadUrl field.
 * This URL is the location in firebase storage to which the file was uploaded.
 *
 * @summary ShortDescription.
 * @customElement
 * @polymer
 * @extends {Polymer.Element}
 */
class FireflyFile extends PolymerElement {
  /**
   * String providing the tag name to register the element under.
   */
  static get is() {
    return 'firefly-file';
  }

  static get template() {
    return html`
      <style>
        :host {
          display: block;
          --icon-size: 50px;
          --icon-color: #2f466f;
          --icon-background: transparent;
        }

        paper-fab {
          --iron-icon-width: var(--icon-size);
          --iron-icon-height: var(--icon-size);
          margin-right: 10px;
          margin-top: 10px;
          padding: 5px;
        }

        label {
          color: #909090;
        }
      </style>

      <paper-fab icon="aspen:upload"></paper-fab><label>[[label]]</label>

      <firebase-auth app-name="[[appName]]"></firebase-auth>
      
      <firebase-storage-multiupload
        app-name="[[appName]]"
        path="[[path]]"
        files="[[files]]"
        upload-tasks="{{uploadTasks}}"
        auto=""
        log=""
      >
      </firebase-storage-multiupload>

      <template is="dom-repeat" items="[[uploadTasks]]">
        <firebase-storage-upload-task
          app-name="[[appName]]"
          path="{{item.path}}"
          task="[[item]]"
          bytes-transferred="{{item.bytesTransferred}}"
          total-bytes="{{item.totalBytes}}"
          download-url="{{item.downloadUrl}}"
          metadata="{{item.metadata}}"
          state="{{item.state}}"
        >
        </firebase-storage-upload-task>
      </template>
    `;
  }

  /**
   * Object describing property-related metadata used by Polymer features
   */
  static get properties() {
    return {
      /** The name of the application. */
      appName: {
        type: String,
        value: ''
      },

      /** The path to the storage location. i.e. '/path/to/directory' used to upload the file to a specific directory*/
      path: {
        type: String,
        value: ''
      },

      files: {
        type: Array,
        value: [],
        notify: true
      },

      uploadTasks: {
        type: Array,
        value: [],
        notify: true
      },

      /** The completely qualified download URL used to retrieve the file. */
      downloadUrl: {
        type: String,
        value: ''
      },

      label: {
        type: String,
        value: 'Drop file on icon to upload'
      },

      state: {
        type: String,
        value: ''
      },

      tempDownload: {
        type: String,
        value: ''
      }
    };
  }

  /**
   * Instance of the element is created/upgraded. Use: initializing state,
   * set up event listeners, create shadow dom.
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * Use for one-time configuration of your component after local DOM is initialized.
   */
  ready() {
    super.ready();

    afterNextRender(this, function() {});
  }

  /**
   * Called every time the element is inserted into the DOM. Useful for
   * running setup code, such as fetching resources or rendering.
   * Generally, you should try to delay work until this time.
   */
  connectedCallback() {
    super.connectedCallback();
    let icon = this.shadowRoot.querySelector('paper-fab');
    icon.addEventListener('drop', e => this.__fileSelected(e));
    icon.addEventListener('dragenter', e => this.__cancelHandler(e));
    icon.addEventListener('dragover', e => this.__cancelHandler(e));
  }

  /**
   * Called every time the element is removed from the DOM. Useful for
   * running clean up code (removing event listeners, etc.).
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    let icon = this.shadowRoot.querySelector('paper-fab');
    icon.removeEventListener('drop', e => this.__fileSelected(e));
    icon.removeEventListener('dragenter', e => this.__cancelHandler(e));
    icon.removeEventListener('dragover', e => this.__cancelHandler(e));
  }

  __cancelHandler(e) {
    e.preventDefault();
  }

  /**
   *
   */
  __stateChanged(state) {
    console.log(state);
    if (state == 'success') {
      //this.set('downloadUrl', tempDownload);
      this.dispatchEvent(
        new CustomEvent('show-msg', {
          bubbles: true,
          composed: true,
          detail: {
            msg: 'Upload complete'
          }
        })
      );
    }
  }

  __fileSelected(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log(e);

    let file = e.dataTransfer.files[0];

    // upload the file
    const storage = this.shadowRoot.querySelector(
      'firebase-storage-multiupload'
    );
    storage.ref
      .child(file.name)
      .put(file)
      .then(snapshot => {
        if (snapshot.state == 'success') {
          return snapshot.ref.getDownloadURL(); // Will return a promise with the download link
        }
      })
      .then(downloadURL => {
        let msg = '';
        try {
          this.set('downloadUrl', downloadURL);
          this.dispatchEvent(
            new CustomEvent('file-upload-complete', {
              bubbles: true,
              composed: true,
              detail: {
                downloadUrl: downloadURL
              }
            })
          );
          msg = 'Icon updated';
        } catch (error) {
          console.error(error);
          msg = 'An error occurred while updating the icon.';
        }

        this.dispatchEvent(
          new CustomEvent('show-msg', {
            bubbles: true,
            composed: true,
            detail: {
              msg: msg
            }
          })
        );
      });
  }
}

window.customElements.define(FireflyFile.is, FireflyFile);
