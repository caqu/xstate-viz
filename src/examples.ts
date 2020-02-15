import { assign } from 'xstate';

const machine = {
  id: 'chooseImage',
  initial: 'showing_toc',
  context: {
    retries: 0,
    image_received: false
  },
  on: {
    EXIT: '.exit'
  },
  states: {
    showing_toc: {
      on: {
        ACCEPT_TOC: 'ready_to_select_image'
      }
    },
    exit: {
      type: 'final'
    },
    ready_to_select_image: {
      on: {
        WITHDRAW_TOC: 'showing_toc',
        UPLOAD_IMAGE: [
          {
            cond: { type: 'image_is_valid' },
            target: 'uploading'
          },
          {
            target: '.invalid_image_selected',
            actions: ['increment_retries']
          }
        ]
      },
      initial: 'ready',
      states: {
        ready: {},
        // client-side validation
        invalid_image_selected: {}
      }
    },
    uploading: {
      on: {
        NETWORK_ERROR: [
          {
            cond: 'customer_is_stuck',
            target: 'upload_failed.showing_retry_and_skip'
          },
          {
            target: 'upload_failed'
          }
        ],
        // TODO Optional proceed to customizer without UGC. proceed_without_image
        SERVER_REJECTION: 'ready_to_select_image.invalid_image_selected',
        RECEIVED: {
          target: 'selecting_style',
          actions: ['mark_image_received']
        },
      }
    },
    // network failure or server-side validation failure
    upload_failed: {
      on: {
        RETRY: {
          target: 'uploading',
          actions: ['increment_retries']
        }
      },
      initial: 'showing_retry',
      states: {
        showing_retry: {},
        showing_retry_and_skip: {
          on: {
            SKIP: {
              target: '#selecting_style'
            }
          }
        }
      }
    },
    selecting_style: {
      id: "selecting_style",
      on: {
        SELECT_STYLE: [
          {
            cond: { type: 'style_has_size' },
            target: 'selecting_size'
          },
          {
            target: 'proceed'
          }
        ]
      }
    },
    selecting_size: {
      on: {
        SELECT_SIZE: 'proceed'
      }
    },
    proceed: {
      initial: 'unknown',
      states: {
        unknown: {
          on: {
            '': [
              { target: 'with_image', cond: { type: 'image_was_received' } },
              { target: 'without_image' }
            ]
          }
        },
        without_image: {
          type: 'final'
        },
        with_image: {
          type: 'final'
        }
      }
    }
  }
};

const options = `{
  guards: {
    image_is_valid: function image_is_valid (_, event) {
      console.log('event.valid', event.valid);
      return event.invalid === undefined;
    },
    customer_is_stuck: function customer_is_stuck (context) {
      console.log('context.retries', context.retries);
      return context.retries > 1;
    },
    style_has_size: function style_has_size (_, event) {
      return event.has_styles === true;
    },
    image_was_received: function image_was_received (context) {
      return context.image_received === true;
    }
  },
  actions: {
    increment_retries: assign({
      retries: (context) => context.retries + 1
    }),
    mark_image_received: assign({
      image_received: true
    }),
  }
}`;

const examples = {
  basic: `
  // Available variables:
  // - Machine
  // - interpret
  // - assign
  // - send
  // - sendParent
  // - spawn
  // - raise
  // - actions
  // - XState (all XState exports)

  const chooseImageMachine = Machine(${JSON.stringify(machine)}, ${options});
  `
};

export { examples };
