export class HE {
  constructor({options}) {

    // Constructors
    this._CipherText = options.CipherText
    this._PlainText = options.PlainText
    this._PublicKey = options.PublicKey
    this._SecretKey = options.SecretKey
    this._RelinKeys = options.RelinKeys
    this._GaloisKeys = options.GaloisKeys

    // Singletons
    this._BatchEncoder = options.BatchEncoder
    this._CKKSEncoder = options.CKKSEncoder
    this._Context = options.Context
    this._Decryptor = options.Decryptor
    this._DefaultParams = options.DefaultParams
    this._EncryptionParameters = options.EncryptionParameters
    this._Encryptor = options.Encryptor
    this._IntegerEncoder = options.IntegerEncoder
    this._KeyGenerator = options.KeyGenerator
    this._Library = options.Library
    this._SchemeType = options.SchemeType
    this._SmallModulus = options.SmallModulus
    this._Vector = options.Vector

    // Instances
    this.publicKey = null
    this.secretKey = null
    this.relinKeys = null
    this.galoisKeys = null

    // Internal helpers
    this._scale = null
    this._polyDegree = null
    this._plainModulus = null
    this._coeffModulus = null
    this._schemeType = null
  }

  set library(m) {
    this._library = m
  }
  get library() {
    return this._library
  }

  set publicKey(key) {
    this._publicKey = key
  }
  get publicKey() {
    return this._publicKey
  }

  set secretKey(key) {
    this._secretKey = key
  }
  get secretKey() {
    return this._secretKey
  }

  set relinKeys(key) {
    this._relinKeys = key
  }
  get relinKeys() {
    return this._relinKeys
  }

  set galoisKeys(key) {
    this._galoisKeys = key
  }
  get galoisKeys() {
    return this._galoisKeys
  }

  /**
   * Print a c++ vector to the console
   * @param vector
   * @param type
   * @param printSize
   * @param precision
   * @returns {*}
   */
  printVector({vector, printSize = 4, precision = 5, type = 'int32'}) {
    return this._Vector.printVector({vector, printSize, precision, type})
  }

  /**
   * Print a c++ vector as a BFV matrix
   * @param vector
   * @param rowSize
   * @param type
   * @returns {*}
   */
  printMatrix({vector, rowSize, type = 'int32'}) {
    return this._Vector.printMatrix({vector, rowSize, type})
  }

  /**
   * Convert an array to a c++ vector
   * @param array
   * @param type
   * @returns {*}
   */
  vecFromArray({array, type = 'int32'}) {
    return this._Vector.vecFromArray({array, type})
  }

  /**
   * Create a good set of default parameters for the encryption library.
   *
   * The `scale` parameter is only used for the CKKS scheme.
   *
   * @param security
   * @returns {{plainModulus: number, scale: number, coeffModulus: number, polyDegree: number}}
   */
  createParams({security = 'low'} = {}) {
    switch (security.toLowerCase()) {
      case 'low':
        return {
          polyDegree: 4096,
          coeffModulus: 4096,
          plainModulus: 786433,
          scale: Math.pow(2, 54) // max 109 - 55
        }
      case 'medium':
        return {
          polyDegree: 8192,
          coeffModulus: 8192,
          plainModulus: 786433,
          scale: Math.pow(2, 163) // max 218 - 55
        }
      case 'high':
        return {
          polyDegree: 16384,
          coeffModulus: 16384,
          plainModulus: 786433,
          scale: Math.pow(2, 383) // max 438 - 55
        }
      default:
        return {
          polyDegree: 4096,
          coeffModulus: 4096,
          plainModulus: 786433,
          scale: Math.pow(2, 54)
        }
    }
  }

  /**
   * Initialized the given context
   * @private
   */
  _initContext() {
    this._Context.initialize({
      encryptionParams: this._EncryptionParameters.instance,
      expandModChain: true
    })
  }

  /**
   * Initializes the BFV parameters for the library
   * @param polyDegree
   * @param coeffModulus
   * @param plainModulus
   * @private
   */
  _initBFV({polyDegree, coeffModulus, plainModulus}) {
    this._SmallModulus.initialize()
    this._SmallModulus.setValue({value: plainModulus})

    this._EncryptionParameters.initialize({
      schemeType: this._SchemeType.BFV,
      polyDegree: polyDegree,
      coeffModulus: this._DefaultParams.coeffModulus128({value: coeffModulus}),
      plainModulus: this._SmallModulus.instance
    })
    this._initContext()

    this._IntegerEncoder.initialize({
      context: this._Context.instance
    })

    this._BatchEncoder.initialize({
      context: this._Context.instance
    })
  }

  /**
   * Initialize the CKKS parameters for the library
   * @param polyDegree
   * @param coeffModulus
   * @private
   */
  _initCKKS({polyDegree, coeffModulus}) {
    this._EncryptionParameters.initialize({
      schemeType: this._SchemeType.CKKS,
      polyDegree: polyDegree,
      coeffModulus: this._DefaultParams.coeffModulus128({value: coeffModulus}),
    })
    this._initContext()

    this._CKKSEncoder.initialize({
      context: this._Context.instance
    })
  }


  /**
   * Initialize the encryption library
   *
   * @param schemeType
   * @param polyDegree
   * @param coeffModulus
   * @param plainModulus
   * @param scale
   */
  initialize({schemeType, polyDegree, coeffModulus, plainModulus, scale}) {
    switch (schemeType) {
      case 'BFV': this._initBFV({polyDegree, coeffModulus, plainModulus}); break;
      case 'CKKS': this._initCKKS({polyDegree, coeffModulus}); break;
      default: this._initBFV({polyDegree, coeffModulus, plainModulus});
    }
    this._scale = scale
    this._polyDegree = polyDegree
    this._plainModulus = plainModulus
    this._coeffModulus = coeffModulus
    this._schemeType = schemeType
  }

  /**
   * Generate the Public and Secret keys to be used for decryption and encryption
   */
  genKeys() {
    this._KeyGenerator.initialize({
      context: this._Context.instance
    })

    if (this.publicKey) {
      delete this.publicKey
    }
    this.publicKey = new this._PublicKey({library: this._Library.instance})
    this.publicKey.inject({instance: this._KeyGenerator.getPublicKey()})

    if (this.secretKey) {
      delete this.secretKey
    }
    this.secretKey = new this._SecretKey({library: this._Library.instance})
    this.secretKey.inject({instance: this._KeyGenerator.getSecretKey()})

    this._Encryptor.initialize({
      context: this._Context.instance,
      publicKey: this.publicKey.instance
    })

    this._Decryptor.initialize({
      context: this._Context.instance,
      secretKey: this.secretKey.instance
    })
  }

  /**
   * Generate the Relinearization Keys to help lower noise after homomorphic operations
   *
   * @param decompositionBitCount
   * @param size - number of relin keys to generate
   */
  genRelinKeys({decompositionBitCount = this._DefaultParams.dbcMax(), size = 1} = {}) {
    if (this.relinKeys) {
      delete this.relinKeys
    }
    this.relinKeys = new this._RelinKeys({library: this._Library.instance})
    this.relinKeys.inject({
      instance: this._KeyGenerator.genRelinKeys({decompositionBitCount, size})
    })
  }

  /**
   * Generate the Galois Keys to perform matrix rotations for vectorized data
   * @param decompositionBitCount
   */
  genGaloisKeys({decompositionBitCount = this._DefaultParams.dbcMax()} = {}) {
    if (this.galoisKeys) {
      delete this.galoisKeys
    }
    this.galoisKeys = new this._GaloisKeys({library: this._Library.instance})
    this.galoisKeys.inject({
      instance: this._KeyGenerator.genGaloisKeys({decompositionBitCount})
    })
  }

  /**
   * Encrypt a value using the BFV scheme
   * @param value
   * @param type
   * @returns {*|CipherText}
   * @private
   */
  _encryptBFV({value, type}) {
    const vector = this.vecFromArray({array: [], type})

    const array = Array.isArray(value)? value: [value]
    if (array.length > this._polyDegree) {
      throw new Error('Input array is too large for the `coeffModulus` specified')
    }

    // TODO: fix this hack for `vecFromArray`
    array.forEach(el => vector.push_back(el))
    console.log('printing vector...')
    this.printVector({vector, type})
    console.log('printing matrix...')
    this.printMatrix({vector, rowSize: this._BatchEncoder.slotCount() / 2, type})

    const plainText = new this._PlainText({library: this._Library.instance})

    console.log('encoding...')
    this._BatchEncoder.encode({vector, plainText: plainText.instance, type})
    console.log('encoding...done!')

    const cipherText = new this._CipherText({library: this._Library.instance})
    console.log('encrypting...')
    this._Encryptor.encrypt({plainText: plainText.instance, cipherText: cipherText.instance})
    console.log('encrypting...done!')

    // Store the vector size so that we may filter the array upon decryption
    cipherText.setVectorSize({size: vector.size()})
    cipherText.setType({type})
    cipherText.setScheme({scheme: 'BFV'})
    return cipherText
  }

  /**
   * Encrypt a value using the CKKS scheme
   * @param value
   * @param type
   * @returns {*|CipherText}
   * @private
   */
  _encryptCKKS({value, type}) {
    const vector = this.vecFromArray({array: [], type})

    const array = Array.isArray(value)? value: [value]
    if (array.length > this._polyDegree) {
      throw new Error('Input array is too large for the `coeffModulus` specified')
    }

    // TODO: fix this hack for `vecFromArray`
    array.forEach(el => vector.push_back(el))

    this.printVector({vector, type})

    const plainText = new this._PlainText({library: this._Library.instance})

    // The CKKSEncoder will implicitly pad the vector
    // with zeros to full size (poly_modulus_degree / 2) when encoding.
    // So we should remember the size.
    this._CKKSEncoder.encode({
      vector,
      scale: this._scale, // Global scale set when creating the context. Can be overridden.
      plainText: plainText.instance,
      type
    })

    const cipherText = new this._CipherText({library: this._Library.instance})
    this._Encryptor.encrypt({plainText: plainText.instance, cipherText: cipherText.instance})

    // Set a few attributes on the
    cipherText.setVectorSize({size: vector.size()})
    cipherText.setType({type})
    cipherText.setScheme({scheme: 'BFV'})
    return cipherText
  }

  /**
   * Encrypt a given value
   * @param value
   * @returns {*|CipherText}
   */
  encrypt({value, type}) {
    switch (this._schemeType) {
      case 'BFV': return this._encryptBFV({value, type})
      case 'CKKS': return this._encryptCKKS({value, type})
      default: return this._encryptBFV({value, type})
    }
  }

  /**
   * Decrypt a ciphertext using the BFV scheme
   * @param cipherText
   * @returns {*}
   * @private
   */
  _decryptBFV({cipherText}) {
    // const plainText = new this._PlainText({library: this._Library.instance})
    // this._Decryptor.decrypt({cipherText: cipherText.instance, plainText: plainText.instance})
    // return this._IntegerEncoder.decodeInt32({plainText: plainText.instance})
    const vector = this.vecFromArray({array: [], type: cipherText.getType()})
    const plainText = new this._PlainText({library: this._Library.instance})

    this._Decryptor.decrypt({cipherText: cipherText.instance, plainText: plainText.instance})
    this._BatchEncoder.decode({plainText: plainText.instance, vector, type: cipherText.getType()})

    // We trim back the vector to the original size that was recorded before encryption was performed
    vector.resize(cipherText.getVectorSize(), 0)

    this.printVector({vector, type: cipherText.getType()})
    this.printMatrix({vector, rowSize: this._BatchEncoder.slotCount() / 2, type: cipherText.getType()})
    return vector
  }

  /**
   * Decrypt a ciphertext using the CKKS scheme
   * @param cipherText
   * @returns {*}
   * @private
   */
  _decryptCKKS({cipherText}) {

    const vector = this.vecFromArray({array: [], type: cipherText.getType()})
    const plainText = new this._PlainText({library: this._Library.instance})

    this._Decryptor.decrypt({cipherText: cipherText.instance, plainText: plainText.instance})
    this._CKKSEncoder.decode({plainText: plainText.instance, vector, type: cipherText.getType()})

    // We trim back the vector to the original size that was recorded before encryption was performed
    vector.resize(cipherText.getVectorSize(), 0)

    this.printVector({vector, type: cipherText.getType()})
    return vector
  }

  /**
   * Decrypt a given ciphertext
   * @param cipherText
   * @returns {*}
   */
  decrypt({cipherText}) {
    switch (this._schemeType) {
      case 'BFV': return this._decryptBFV({cipherText})
      case 'CKKS': return this._decryptCKKS({cipherText})
      default: return this._decryptBFV({cipherText})
    }
  }

  /**
   * Load a public key to be used for encryption
   * @param encoded
   */
  loadPublicKey({encoded}) {
    if (this.publicKey) {
      delete this.publicKey
    }

    this.publicKey = new this._PublicKey({library: this._Library.instance})
    this.publicKey.load({context: this._Context.instance, encoded})

    this._Encryptor.initialize({
      context: this._Context.instance,
      publicKey: this.publicKey.instance
    })

  }

  /**
   * Load a secret key to be used for encryption
   * @param encoded
   */
  loadSecretKey({encoded}) {
    if (this.secretKey) {
      delete this.secretKey
    }

    this.secretKey = new this._SecretKey({library: this._Library.instance})
    this.secretKey.load({context: this._Context.instance, encoded})

    this._Decryptor.initialize({
      context: this._Context.instance,
      secretKey: this.secretKey.instance
    })
  }

  /**
   * Load the relin keys to be used to reduce noise after HE operations
   * @param encoded
   */
  loadRelinKeys({encoded}) {
    if (this.relinKeys) {
      delete this.relinKeys
    }

    this.relinKeys = new this._RelinKeys({library: this._Library.instance})
    this.relinKeys.load({context: this._Context.instance, encoded})
  }

  /**
   * Load the galois keys to perform matrix rotations
   * @param encoded
   */
  loadGaloisKeys({encoded}) {
    if (this.galoisKeys) {
      delete this.galoisKeys
    }

    this.galoisKeys = new this._GaloisKeys({library: this._Library.instance})
    this.galoisKeys.load({context: this._Context.instance, encoded})
  }

  /**
   * Save a public key as a base64 string
   * @returns {*}
   */
  savePublicKey() {
    return this.publicKey.save()
  }

  /**
   * Save a secret key as a base64 string
   * @returns {*}
   */
  saveSecretKey() {
    return this.secretKey.save()
  }

  /**
   * Save the relin keys as a base64 string
   * @returns {*}
   */
  saveRelinKeys() {
    return this.relinKeys.save()
  }

  /**
   * Save the galois keys as a base64 string
   * @returns {*}
   */
  saveGaloisKeys() {
    return this.galoisKeys.save()
  }
}
