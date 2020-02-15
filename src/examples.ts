const machine = {
  id: 'addYourOwnContent',
  initial: 'selecting_image',
  context: {
    retries: 0,
    image_received: false
  },
  on: {
    EXIT: '.exit'
  },
  states: {
    selecting_image: {
      initial: 'waiting_for_toc_acceptance',
      states: {
        waiting_for_toc_acceptance: {
          id: 'waiting_for_toc_acceptance',
          on: {
            ACCEPT_TOC: '#ready_to_select_image'
          }
        },
        ready_to_select_image: {
          id: 'ready_to_select_image',
          on: {
            WITHDRAW_TOC: '#waiting_for_toc_acceptance',
            UPLOAD_IMAGE: [
              {
                cond: { type: 'image_is_valid' },
                target: '#uploading_image'
              },
              {
                target: '#invalid_image_selected',
                actions: ['increment_retries']
              }
            ]
          }
        },
        // client-side validation
        invalid_image_selected: {
          id: "invalid_image_selected",
          on: {
            UPLOAD_IMAGE: [
              {
                cond: { type: 'image_is_valid' },
                target: '#uploading_image'
              },
              {
                target: '#invalid_image_selected',
                actions: ['increment_retries']
              }
            ]
          }
        }
      }
    },
    exit: {
      type: 'final'
    },
    uploading_image: {
      id: 'uploading_image',
      initial: 'sending',
      states: {
        sending: {
          on: {
            NETWORK_ERROR: [
              {
                cond: 'customer_is_stuck',
                target: '#upload_failed_again'
              },
              {
                target: '#upload_failed'
              }
            ],
            SERVER_REJECTION: [
              {
                cond: 'customer_is_stuck',
                target: '#addYourOwnContent.selecting_image.invalid_image_selected'
              },
              {
                target: '#addYourOwnContent.selecting_image.invalid_image_selected'
              }
            ],
            RECEIVED: {
              target: '#selecting_style',
              actions: ['mark_image_received']
            },
          }
        },
        upload_failed: {
          id: "upload_failed",
          on: {
            RETRY: {
              target: 'sending',
              actions: ['increment_retries']
            }
          },
        },
        upload_failed_again: {
          id: "upload_failed_again",
          on: {
            RETRY: {
              target: 'sending',
              actions: ['increment_retries']
            },
            SKIP: {
              target: '#selecting_style'
            }
          },
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
            target: 'moving_to_customizer'
          }
        ]
      }
    },
    selecting_size: {
      on: {
        SELECT_SIZE: 'moving_to_customizer'
      }
    },
    moving_to_customizer: {
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
      return event.invalid === undefined;
    },
    customer_is_stuck: function customer_is_stuck (context) {
      console.log('context.retries', context.retries);
      return context.retries > 0;
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
