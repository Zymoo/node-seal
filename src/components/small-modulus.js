export const SmallModulus = library => ({ Exception, ComprModeType }) => (
  instance = null
) => {
  const Constructor = library.SmallModulus

  let _instance
  try {
    if (typeof instance === 'string') {
      _instance = new Constructor()
      _instance.setValue(instance)
    } else if (instance) {
      _instance = new Constructor(instance)
      instance.delete()
    } else {
      _instance = new Constructor()
    }
  } catch (e) {
    throw Exception.safe(e)
  }

  /**
   * @implements SmallModulus
   */

  /**
   * @interface SmallModulus
   */
  return {
    /**
     * Get the underlying WASM instance
     *
     * @private
     * @readonly
     * @name SmallModulus#instance
     * @type {instance}
     */
    get instance() {
      return _instance
    },

    /**
     * Inject this object with a raw WASM instance
     *
     * @private
     * @function
     * @name SmallModulus#inject
     * @param {instance} instance WASM instance
     */
    inject(instance) {
      if (_instance) {
        _instance.delete()
        _instance = null
      }
      _instance = new Constructor(instance)
      instance.delete()
    },

    /**
     * Delete the underlying WASM instance.
     *
     * Should be called before dereferencing this object to prevent the
     * WASM heap from growing indefinitely.
     * @function
     * @name SmallModulus#delete
     */
    delete() {
      if (_instance) {
        _instance.delete()
        _instance = null
      }
    },

    /**
     * Loads a SmallModulus from a string representing an uint64 value.
     *
     * @function
     * @name SmallModulus#setValue
     * @param {String} value String representation of a uint64 value
     */
    setValue(value) {
      try {
        _instance.setValue(value)
      } catch (e) {
        throw Exception.safe(e)
      }
    },

    /**
     * The value of the current SmallModulus as a BigInt.
     *
     * @readonly
     * @name SmallModulus#value
     * @type {BigInt}
     */
    get value() {
      // eslint-disable-next-line no-undef
      return BigInt(_instance.value())
    },

    /**
     * The significant bit count of the value of the current SmallModulus.
     *
     * @readonly
     * @name SmallModulus#bitCount
     * @type {Number}
     */
    get bitCount() {
      return _instance.bitCount()
    },

    /**
     * Whether the value of the current SmallModulus is zero.
     *
     * @readonly
     * @name SmallModulus#isZero
     * @type {Boolean}
     */
    get isZero() {
      return _instance.isZero()
    },

    /**
     * Whether the value of the current SmallModulus is a prime number.
     *
     * @readonly
     * @name SmallModulus#isPrime
     * @type {Boolean}
     */
    get isPrime() {
      return _instance.isPrime()
    },

    /**
     * Save the SmallModulus as a base64 string
     *
     * @function
     * @name SmallModulus#save
     * @param {ComprModeType} [compression={@link ComprModeType.deflate}] The compression mode to use
     * @returns {String} Base64 encoded string
     */
    save(compression = ComprModeType.deflate) {
      try {
        return _instance.saveToString(compression)
      } catch (e) {
        throw Exception.safe(e)
      }
    },

    /**
     * Load a SmallModulus from a base64 string
     *
     * @function
     * @name SecretKey#load
     * @param {String} encoded Base64 encoded string
     */
    load(encoded) {
      try {
        _instance.loadFromString(encoded)
      } catch (e) {
        throw Exception.safe(e)
      }
    }
  }
}
