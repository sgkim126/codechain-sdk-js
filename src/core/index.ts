import { AssetTransferAddress, PlatformAddress } from "codechain-primitives";

import { Asset } from "./Asset";
import { AssetScheme } from "./AssetScheme";
import { Block } from "./Block";
import { H128 } from "./H128";
import { H160 } from "./H160";
import { H256 } from "./H256";
import { H512 } from "./H512";
import { Invoice } from "./Invoice";
import { Script } from "./Script";
import { SignedTransaction } from "./SignedTransaction";
import { Transaction } from "./Transaction";
import { AssetMintOutput } from "./transaction/AssetMintOutput";
import { AssetOutPoint } from "./transaction/AssetOutPoint";
import { AssetTransferInput, Timelock } from "./transaction/AssetTransferInput";
import { AssetTransferOutput } from "./transaction/AssetTransferOutput";
import { ChangeAssetScheme } from "./transaction/ChangeAssetScheme";
import { ComposeAsset } from "./transaction/ComposeAsset";
import { CreateShard } from "./transaction/CreateShard";
import { Custom } from "./transaction/Custom";
import { DecomposeAsset } from "./transaction/DecomposeAsset";
import { MintAsset } from "./transaction/MintAsset";
import { Order } from "./transaction/Order";
import { OrderOnTransfer } from "./transaction/OrderOnTransfer";
import { Pay } from "./transaction/Pay";
import { Remove } from "./transaction/Remove";
import { SetRegularKey } from "./transaction/SetRegularKey";
import { SetShardOwners } from "./transaction/SetShardOwners";
import { SetShardUsers } from "./transaction/SetShardUsers";
import { Store } from "./transaction/Store";
import { TransferAsset } from "./transaction/TransferAsset";
import { UnwrapCCC } from "./transaction/UnwrapCCC";
import { WrapCCC } from "./transaction/WrapCCC";
import { NetworkId } from "./types";
import { U256 } from "./U256";
import { U64 } from "./U64";

export class Core {
    public static classes = {
        // Data
        H128,
        H160,
        H256,
        H512,
        U256,
        U64,
        Invoice,
        // Block
        Block,
        // Transaction
        Transaction,
        SignedTransaction,
        // Transaction
        Pay,
        SetRegularKey,
        CreateShard,
        SetShardOwners,
        SetShardUsers,
        WrapCCC,
        Store,
        Remove,
        Custom,
        AssetTransferInput,
        AssetTransferOutput,
        AssetOutPoint,
        // Asset and AssetScheme
        Asset,
        AssetScheme,
        // Script
        Script,
        // Addresses
        PlatformAddress,
        AssetTransferAddress
    };

    public classes = Core.classes;
    private networkId: NetworkId;

    /**
     * @param params.networkId The network id of CodeChain.
     */
    constructor(params: { networkId: NetworkId }) {
        const { networkId } = params;
        this.networkId = networkId;
    }

    /**
     * Creates Pay action which pays the value amount of CCC(CodeChain Coin)
     * from the tx signer to the recipient. Who is signing the tx will pay.
     * @param params.recipient The platform account who receives CCC
     * @param params.amount Amount of CCC to pay
     * @throws Given string for recipient is invalid for converting it to PlatformAddress
     * @throws Given number or string for amount is invalid for converting it to U64
     */
    public createPayTransaction(params: {
        recipient: PlatformAddress | string;
        amount: U64 | number | string;
    }): Pay {
        const { recipient, amount } = params;
        checkPlatformAddressRecipient(recipient);
        checkAmount(amount);
        return new Pay(
            PlatformAddress.ensure(recipient),
            U64.ensure(amount),
            this.networkId
        );
    }

    /**
     * Creates SetRegularKey action which sets the regular key of the tx signer.
     * @param params.key The public key of a regular key
     * @throws Given string for key is invalid for converting it to H512
     */
    public createSetRegularKeyTransaction(params: {
        key: H512 | string;
    }): SetRegularKey {
        const { key } = params;
        checkKey(key);
        return new SetRegularKey(H512.ensure(key), this.networkId);
    }

    /**
     * Creates CreateShard action which can create new shard
     */
    public createCreateShardTransaction(): CreateShard {
        return new CreateShard(this.networkId);
    }

    public createSetShardOwnersTransaction(params: {
        shardId: number;
        owners: Array<PlatformAddress | string>;
    }): SetShardOwners {
        const { shardId, owners } = params;
        checkShardId(shardId);
        checkOwners(owners);
        return new SetShardOwners(
            {
                shardId,
                owners: owners.map(PlatformAddress.ensure)
            },
            this.networkId
        );
    }

    /**
     * Create SetShardUser action which can change shard users
     * @param params.shardId
     * @param params.users
     */
    public createSetShardUsersTransaction(params: {
        shardId: number;
        users: Array<PlatformAddress | string>;
    }): SetShardUsers {
        const { shardId, users } = params;
        checkShardId(shardId);
        checkUsers(users);
        return new SetShardUsers(
            {
                shardId,
                users: users.map(PlatformAddress.ensure)
            },
            this.networkId
        );
    }

    /**
     * Creates Wrap CCC action which wraps the value amount of CCC(CodeChain Coin)
     * in a wrapped CCC asset. Who is signing the tx will pay.
     * @param params.shardId A shard ID of the wrapped CCC asset.
     * @param params.lockScriptHash A lock script hash of the wrapped CCC asset.
     * @param params.parameters Parameters of the wrapped CCC asset.
     * @param params.amount Amount of CCC to pay
     * @throws Given string for a lock script hash is invalid for converting it to H160
     * @throws Given number or string for amount is invalid for converting it to U64
     */
    public createWrapCCCTransaction(
        params:
            | {
                  shardId: number;
                  lockScriptHash: H160 | string;
                  parameters: Buffer[];
                  amount: U64 | number | string;
              }
            | {
                  shardId: number;
                  recipient: AssetTransferAddress | string;
                  amount: U64 | number | string;
              }
    ): WrapCCC {
        const { shardId, amount } = params;
        checkShardId(shardId);
        checkAmount(amount);
        let data;
        if ("recipient" in params) {
            checkAssetTransferAddressRecipient(params.recipient);
            data = {
                shardId,
                recipient: AssetTransferAddress.ensure(params.recipient),
                amount: U64.ensure(amount)
            };
        } else {
            const { lockScriptHash, parameters } = params;
            checkLockScriptHash(lockScriptHash);
            checkParameters(parameters);
            data = {
                shardId,
                lockScriptHash: H160.ensure(lockScriptHash),
                parameters,
                amount: U64.ensure(amount)
            };
        }
        return new WrapCCC(data, this.networkId);
    }

    /**
     * Creates Store action which store content with certifier on chain.
     * @param params.content Content to store
     * @param params.secret Secret key to sign
     * @param params.certifier Certifier of the text, which is PlatformAddress
     * @param params.signature Signature on the content by the certifier
     * @throws Given string for secret is invalid for converting it to H256
     */
    public createStoreTransaction(
        params:
            | {
                  content: string;
                  certifier: PlatformAddress | string;
                  signature: string;
              }
            | {
                  content: string;
                  secret: H256 | string;
              }
    ): Store {
        let storeParams;
        if ("secret" in params) {
            const { content, secret } = params;
            checkSecret(secret);
            storeParams = {
                content,
                secret: H256.ensure(secret)
            };
        } else {
            const { content, certifier, signature } = params;
            checkCertifier(certifier);
            checkSignature(signature);
            storeParams = {
                content,
                certifier: PlatformAddress.ensure(certifier),
                signature
            };
        }
        return new Store(storeParams, this.networkId);
    }

    /**
     * Creates Remove action which remove the text from the chain.
     * @param params.hash Transaction hash which stored the text
     * @param params.secret Secret key to sign
     * @param params.signature Signature on tx hash by the certifier of the text
     * @throws Given string for hash or secret is invalid for converting it to H256
     */
    public createRemoveTransaction(
        params:
            | {
                  hash: H256 | string;
                  secret: H256 | string;
              }
            | {
                  hash: H256 | string;
                  signature: string;
              }
    ): Remove {
        let removeParam = null;
        if ("secret" in params) {
            const { hash, secret } = params;
            checkTransactionHash(hash);
            checkSecret(secret);
            removeParam = {
                hash: H256.ensure(hash),
                secret: H256.ensure(secret)
            };
        } else {
            const { hash, signature } = params;
            checkTransactionHash(hash);
            checkSignature(signature);
            removeParam = {
                hash: H256.ensure(hash),
                signature
            };
        }
        return new Remove(removeParam, this.networkId);
    }

    /**
     * Creates Custom action that will be handled by a specified action handler
     * @param params.handlerId An Id of an action handler which will handle a custom transaction
     * @param params.bytes A custom transaction body
     * @throws Given number for handlerId is invalid for converting it to U64
     */
    public createCustomTransaction(params: {
        handlerId: number;
        bytes: Buffer;
    }): Custom {
        const { handlerId, bytes } = params;
        checkHandlerId(handlerId);
        checkBytes(bytes);
        const customParam = {
            handlerId: U64.ensure(handlerId),
            bytes
        };
        return new Custom(customParam, this.networkId);
    }

    /**
     * Creates asset's scheme.
     * @param params.metadata Any string that describing the asset. For example,
     * stringified JSON containing properties.
     * @param params.amount Total amount of this asset
     * @param params.approver Platform account or null. If account is present, the
     * tx that includes AssetTransferTransaction of this asset must be signed by
     * the approver account.
     * @param params.administrator Platform account or null. The administrator
     * can transfer the asset without unlocking.
     * @throws Given string for approver is invalid for converting it to paltform account
     * @throws Given string for administrator is invalid for converting it to paltform account
     */
    public createAssetScheme(params: {
        shardId: number;
        metadata: string;
        amount: U64 | number | string;
        approver?: PlatformAddress | string;
        administrator?: PlatformAddress | string;
        pool?: { assetType: H256 | string; amount: number }[];
    }): AssetScheme {
        const {
            shardId,
            metadata,
            amount,
            approver = null,
            administrator = null,
            pool = []
        } = params;
        checkShardId(shardId);
        checkMetadata(metadata);
        checkAmount(amount);
        checkApprover(approver);
        checkAdministrator(administrator);
        return new AssetScheme({
            networkId: this.networkId,
            shardId,
            metadata,
            amount: U64.ensure(amount),
            approver:
                approver == null ? null : PlatformAddress.ensure(approver),
            administrator:
                administrator == null
                    ? null
                    : PlatformAddress.ensure(administrator),
            pool: pool.map(({ assetType, amount: assetAmount }) => ({
                assetType: H256.ensure(assetType),
                amount: U64.ensure(assetAmount)
            }))
        });
    }

    public createOrder(
        params: {
            assetTypeFrom: H256 | string;
            assetTypeTo: H256 | string;
            assetTypeFee?: H256 | string;
            assetAmountFrom: U64 | number | string;
            assetAmountTo: U64 | number | string;
            assetAmountFee?: U64 | number | string;
            originOutputs:
                | AssetOutPoint[]
                | {
                      transactionId: H256 | string;
                      index: number;
                      assetType: H256 | string;
                      amount: U64 | number | string;
                      lockScriptHash?: H256 | string;
                      parameters?: Buffer[];
                  }[];
            expiration: U64 | number | string;
        } & (
            | {
                  lockScriptHashFrom: H160 | string;
                  parametersFrom: Buffer[];
              }
            | {
                  recipientFrom: AssetTransferAddress | string;
              }) &
            (
                | {
                      lockScriptHashFee: H160 | string;
                      parametersFee: Buffer[];
                  }
                | {
                      recipientFee: AssetTransferAddress | string;
                  }
                | {})
    ): Order {
        const {
            assetTypeFrom,
            assetTypeTo,
            assetTypeFee = "0".repeat(64),
            assetAmountFrom,
            assetAmountTo,
            assetAmountFee = 0,
            originOutputs,
            expiration
        } = params;
        checkAssetType(assetTypeFrom);
        checkAssetType(assetTypeTo);
        checkAssetType(assetTypeFee);
        checkAmount(assetAmountFrom);
        checkAmount(assetAmountTo);
        checkAmount(assetAmountFee);
        checkExpiration(expiration);
        const originOutputsConv: AssetOutPoint[] = [];
        for (let i = 0; i < originOutputs.length; i++) {
            const originOutput = originOutputs[i];
            const {
                transactionId,
                index,
                assetType,
                amount,
                lockScriptHash,
                parameters
            } = originOutput;
            checkAssetOutPoint(originOutput);
            originOutputsConv[i] =
                originOutput instanceof AssetOutPoint
                    ? originOutput
                    : new AssetOutPoint({
                          transactionId: H256.ensure(transactionId),
                          index,
                          assetType: H256.ensure(assetType),
                          amount: U64.ensure(amount),
                          lockScriptHash: lockScriptHash
                              ? H160.ensure(lockScriptHash)
                              : undefined,
                          parameters
                      });
        }

        const baseParams = {
            assetTypeFrom: H256.ensure(assetTypeFrom),
            assetTypeTo: H256.ensure(assetTypeTo),
            assetTypeFee: H256.ensure(assetTypeFee),
            assetAmountFrom: U64.ensure(assetAmountFrom),
            assetAmountTo: U64.ensure(assetAmountTo),
            assetAmountFee: U64.ensure(assetAmountFee),
            expiration: U64.ensure(expiration),
            originOutputs: originOutputsConv
        };
        let toParams;
        let feeParams;

        if ("recipientFrom" in params) {
            checkAssetTransferAddressRecipient(params.recipientFrom);
            toParams = {
                recipientFrom: AssetTransferAddress.ensure(params.recipientFrom)
            };
        } else {
            const { lockScriptHashFrom, parametersFrom } = params;
            checkLockScriptHash(lockScriptHashFrom);
            checkParameters(parametersFrom);
            toParams = {
                lockScriptHashFrom: H160.ensure(lockScriptHashFrom),
                parametersFrom
            };
        }

        if ("recipientFee" in params) {
            checkAssetTransferAddressRecipient(params.recipientFee);
            feeParams = {
                recipientFee: AssetTransferAddress.ensure(params.recipientFee)
            };
        } else if ("lockScriptHashFee" in params) {
            const { lockScriptHashFee, parametersFee } = params;
            checkLockScriptHash(lockScriptHashFee);
            checkParameters(parametersFee);
            feeParams = {
                lockScriptHashFee: H160.ensure(lockScriptHashFee),
                parametersFee
            };
        } else {
            feeParams = {
                lockScriptHashFee: H160.ensure("0".repeat(40)),
                parametersFee: []
            };
        }

        return new Order({
            ...baseParams,
            ...toParams,
            ...feeParams
        });
    }
    public createOrderOnTransfer(params: {
        order: Order;
        spentAmount: U64 | string | number;
        inputIndices: number[];
        outputIndices: number[];
    }) {
        const { order, spentAmount, inputIndices, outputIndices } = params;
        checkOrder(order);
        checkAmount(spentAmount);
        checkIndices(inputIndices);
        checkIndices(outputIndices);

        return new OrderOnTransfer({
            order,
            spentAmount: U64.ensure(spentAmount),
            inputIndices,
            outputIndices
        });
    }

    public createMintAssetTransaction(params: {
        scheme:
            | AssetScheme
            | {
                  networkId?: NetworkId;
                  shardId: number;
                  metadata: string;
                  approver?: PlatformAddress | string;
                  administrator?: PlatformAddress | string;
                  amount?: U64 | number | string | null;
              };
        recipient: AssetTransferAddress | string;
        approvals?: string[];
    }): MintAsset {
        const { scheme, recipient, approvals = [] } = params;
        if (scheme !== null && typeof scheme !== "object") {
            throw Error(
                `Expected scheme param to be either an AssetScheme or an object but found ${scheme}`
            );
        }
        const {
            networkId = this.networkId,
            shardId,
            metadata,
            approver: approver = null,
            administrator: administrator = null,
            amount
        } = scheme;
        checkAssetTransferAddressRecipient(recipient);
        checkNetworkId(networkId);
        if (shardId === undefined) {
            throw Error(`shardId is undefined`);
        }
        checkShardId(shardId);
        checkMetadata(metadata);
        checkApprover(approver);
        checkAdministrator(administrator);
        if (amount != null) {
            checkAmount(amount);
        }
        return new MintAsset({
            networkId,
            shardId,
            approver:
                approver == null ? null : PlatformAddress.ensure(approver),
            administrator:
                administrator == null
                    ? null
                    : PlatformAddress.ensure(administrator),
            metadata,
            output: new AssetMintOutput({
                amount: amount == null ? null : U64.ensure(amount),
                recipient: AssetTransferAddress.ensure(recipient)
            }),
            approvals
        });
    }

    public createChangeAssetSchemeTransaction(params: {
        assetType: H256 | string;
        scheme:
            | AssetScheme
            | {
                  networkId?: NetworkId;
                  metadata: string;
                  approver?: PlatformAddress | string;
                  administrator?: PlatformAddress | string;
              };
        approvals?: string[];
    }): ChangeAssetScheme {
        const { assetType, scheme, approvals = [] } = params;
        if (scheme !== null && typeof scheme !== "object") {
            throw Error(
                `Expected scheme param to be either an AssetScheme or an object but found ${scheme}`
            );
        }
        const {
            networkId = this.networkId,
            metadata,
            approver: approver = null,
            administrator: administrator = null
        } = scheme;
        checkNetworkId(networkId);
        checkAssetType(assetType);
        checkMetadata(metadata);
        checkApprover(approver);
        checkAdministrator(administrator);
        return new ChangeAssetScheme({
            networkId,
            assetType: H256.ensure(assetType),
            metadata,
            approver:
                approver == null ? null : PlatformAddress.ensure(approver),
            administrator:
                administrator == null
                    ? null
                    : PlatformAddress.ensure(administrator),
            approvals
        });
    }

    public createTransferAssetTransaction(params?: {
        burns?: AssetTransferInput[];
        inputs?: AssetTransferInput[];
        outputs?: AssetTransferOutput[];
        orders?: OrderOnTransfer[];
        networkId?: NetworkId;
        approvals?: string[];
    }): TransferAsset {
        const {
            burns = [],
            inputs = [],
            outputs = [],
            orders = [],
            networkId = this.networkId,
            approvals = []
        } = params || {};
        checkTransferBurns(burns);
        checkTransferInputs(inputs);
        checkTransferOutputs(outputs);
        checkNetworkId(networkId);
        return new TransferAsset({
            burns,
            inputs,
            outputs,
            orders,
            networkId,
            approvals
        });
    }

    public createComposeAssetTransaction(params: {
        scheme:
            | AssetScheme
            | {
                  shardId: number;
                  metadata: string;
                  amount?: U64 | number | string | null;
                  approver?: PlatformAddress | string;
                  administrator?: PlatformAddress | string;
                  networkId?: NetworkId;
              };
        inputs: AssetTransferInput[];
        recipient: AssetTransferAddress | string;
        approvals?: string[];
    }): ComposeAsset {
        const { scheme, inputs, recipient, approvals = [] } = params;
        const {
            networkId = this.networkId,
            shardId,
            metadata,
            approver = null,
            administrator = null,
            amount
        } = scheme;
        checkTransferInputs(inputs);
        checkAssetTransferAddressRecipient(recipient);
        checkNetworkId(networkId);
        if (shardId === undefined) {
            throw Error(`shardId is undefined`);
        }
        checkShardId(shardId);
        checkMetadata(metadata);
        checkApprover(approver);
        if (amount != null) {
            checkAmount(amount);
        }
        return new ComposeAsset({
            networkId,
            shardId,
            approver:
                approver == null ? null : PlatformAddress.ensure(approver),
            administrator:
                administrator == null
                    ? null
                    : PlatformAddress.ensure(administrator),
            metadata,
            inputs,
            output: new AssetMintOutput({
                recipient: AssetTransferAddress.ensure(recipient),
                amount: amount == null ? null : U64.ensure(amount)
            }),
            approvals
        });
    }

    public createDecomposeAssetTransaction(params: {
        input: AssetTransferInput;
        outputs?: AssetTransferOutput[];
        networkId?: NetworkId;
        approvals?: string[];
    }): DecomposeAsset {
        if (
            params === null ||
            typeof params !== "object" ||
            !("input" in params)
        ) {
            throw Error(
                `Expected the first param of createAssetDecomposeTransaction to be an object containing input param but found ${params}`
            );
        }
        const {
            input,
            outputs = [],
            networkId = this.networkId,
            approvals = []
        } = params;
        checkTransferInput(input);
        checkTransferOutputs(outputs);
        checkNetworkId(networkId);
        return new DecomposeAsset({
            input,
            outputs,
            networkId,
            approvals
        });
    }

    public createUnwrapCCCTransaction(params: {
        burn: AssetTransferInput | Asset;
        networkId?: NetworkId;
        approvals?: string[];
    }): UnwrapCCC {
        const { burn, networkId = this.networkId, approvals = [] } = params;
        checkNetworkId(networkId);
        if (burn instanceof Asset) {
            const burnInput = burn.createTransferInput();
            checkTransferBurns([burnInput]);
            return new UnwrapCCC({
                burn: burnInput,
                networkId,
                approvals
            });
        } else {
            checkTransferBurns([burn]);
            return new UnwrapCCC({
                burn,
                networkId,
                approvals
            });
        }
    }

    public createAssetTransferInput(params: {
        assetOutPoint:
            | AssetOutPoint
            | {
                  transactionId: H256 | string;
                  index: number;
                  assetType: H256 | string;
                  amount: U64 | number | string;
                  lockScriptHash?: H256 | string;
                  parameters?: Buffer[];
              };
        timelock?: null | Timelock;
        lockScript?: Buffer;
        unlockScript?: Buffer;
    }): AssetTransferInput {
        const {
            assetOutPoint,
            timelock = null,
            lockScript,
            unlockScript
        } = params;
        checkAssetOutPoint(assetOutPoint);
        checkTimelock(timelock);
        if (lockScript) {
            checkLockScript(lockScript);
        }
        if (unlockScript) {
            checkUnlockScript(unlockScript);
        }
        const {
            transactionId,
            index,
            assetType,
            amount,
            lockScriptHash,
            parameters
        } = assetOutPoint;
        return new AssetTransferInput({
            prevOut:
                assetOutPoint instanceof AssetOutPoint
                    ? assetOutPoint
                    : new AssetOutPoint({
                          transactionId: H256.ensure(transactionId),
                          index,
                          assetType: H256.ensure(assetType),
                          amount: U64.ensure(amount),
                          lockScriptHash: lockScriptHash
                              ? H160.ensure(lockScriptHash)
                              : undefined,
                          parameters
                      }),
            timelock,
            lockScript,
            unlockScript
        });
    }

    public createAssetOutPoint(params: {
        transactionId: H256 | string;
        index: number;
        assetType: H256 | string;
        amount: U64 | number | string;
    }): AssetOutPoint {
        const { transactionId, index, assetType, amount } = params;
        checkTransactionId(transactionId);
        checkIndex(index);
        checkAssetType(assetType);
        checkAmount(amount);
        return new AssetOutPoint({
            transactionId: H256.ensure(transactionId),
            index,
            assetType: H256.ensure(assetType),
            amount: U64.ensure(amount)
        });
    }

    public createAssetTransferOutput(
        params: {
            assetType: H256 | string;
            amount: U64 | number | string;
        } & (
            | {
                  recipient: AssetTransferAddress | string;
              }
            | {
                  lockScriptHash: H256 | string;
                  parameters: Buffer[];
              })
    ): AssetTransferOutput {
        const { assetType } = params;
        const amount = U64.ensure(params.amount);
        checkAssetType(assetType);
        checkAmount(amount);
        if ("recipient" in params) {
            const { recipient } = params;
            checkAssetTransferAddressRecipient(recipient);
            return new AssetTransferOutput({
                recipient: AssetTransferAddress.ensure(recipient),
                assetType: H256.ensure(assetType),
                amount
            });
        } else if ("lockScriptHash" in params && "parameters" in params) {
            const { lockScriptHash, parameters } = params;
            checkLockScriptHash(lockScriptHash);
            checkParameters(parameters);
            return new AssetTransferOutput({
                lockScriptHash: H160.ensure(lockScriptHash),
                parameters,
                assetType: H256.ensure(assetType),
                amount
            });
        } else {
            throw Error(`Unexpected params: ${params}`);
        }
    }
}

function checkNetworkId(networkId: NetworkId) {
    if (typeof networkId !== "string" || networkId.length !== 2) {
        throw Error(
            `Expected networkId param to be a string of length 2 but found ${networkId}`
        );
    }
}

function checkPlatformAddressRecipient(recipient: PlatformAddress | string) {
    if (!PlatformAddress.check(recipient)) {
        throw Error(
            `Expected recipient param to be a PlatformAddress but found ${recipient}`
        );
    }
}

function checkAssetTransferAddressRecipient(
    recipient: AssetTransferAddress | string
) {
    if (!AssetTransferAddress.check(recipient)) {
        throw Error(
            `Expected recipient param to be a AssetTransferAddress but found ${recipient}`
        );
    }
}

function checkAmount(amount: U64 | number | string) {
    if (!U64.check(amount)) {
        throw Error(
            `Expected amount param to be a U64 value but found ${amount}`
        );
    }
}

function checkExpiration(expiration: U64 | number | string) {
    if (!U64.check(expiration)) {
        throw Error(
            `Expected expiration param to be a U64 value but found ${expiration}`
        );
    }
}

function checkKey(key: H512 | string) {
    if (!H512.check(key)) {
        throw Error(`Expected key param to be an H512 value but found ${key}`);
    }
}

function checkShardId(shardId: number) {
    if (
        typeof shardId !== "number" ||
        !Number.isInteger(shardId) ||
        shardId < 0 ||
        shardId > 0xffff
    ) {
        throw Error(
            `Expected shardId param to be a number but found ${shardId}`
        );
    }
}

function checkMetadata(metadata: string) {
    if (typeof metadata !== "string") {
        throw Error(
            `Expected metadata param to be a string but found ${metadata}`
        );
    }
}

function checkApprover(approver: PlatformAddress | string | null) {
    if (approver !== null && !PlatformAddress.check(approver)) {
        throw Error(
            `Expected approver param to be either null or a PlatformAddress value but found ${approver}`
        );
    }
}

function checkAdministrator(administrator: PlatformAddress | string | null) {
    if (administrator !== null && !PlatformAddress.check(administrator)) {
        throw Error(
            `Expected administrator param to be either null or a PlatformAddress value but found ${administrator}`
        );
    }
}

function checkCertifier(certifier: PlatformAddress | string) {
    if (!PlatformAddress.check(certifier)) {
        throw Error(
            `Expected certifier param to be a PlatformAddress but found ${certifier}`
        );
    }
}

function checkOwners(owners: Array<PlatformAddress | string>) {
    if (!Array.isArray(owners)) {
        throw Error(`Expected owners param to be an array but found ${owners}`);
    }
    owners.forEach((owner, index) => {
        if (!PlatformAddress.check(owner)) {
            throw Error(
                `Expected an owner address to be a PlatformAddress value but found ${owner} at index ${index}`
            );
        }
    });
}

function checkUsers(users: Array<PlatformAddress | string>) {
    if (!Array.isArray(users)) {
        throw Error(`Expected users param to be an array but found ${users}`);
    }
    users.forEach((user, index) => {
        if (!PlatformAddress.check(user)) {
            throw Error(
                `Expected a user address to be a PlatformAddress value but found ${user} at index ${index}`
            );
        }
    });
}

function checkTransferBurns(burns: Array<AssetTransferInput>) {
    if (!Array.isArray(burns)) {
        throw Error(`Expected burns param to be an array but found ${burns}`);
    }
    burns.forEach((burn, index) => {
        if (!(burn instanceof AssetTransferInput)) {
            throw Error(
                `Expected an item of burns to be an AssetTransferInput but found ${burn} at index ${index}`
            );
        }
    });
}

function checkTransferInput(input: AssetTransferInput) {
    if (!(input instanceof AssetTransferInput)) {
        throw Error(
            `Expected an input param to be an AssetTransferInput but found ${input}`
        );
    }
}

function checkTransferInputs(inputs: Array<AssetTransferInput>) {
    if (!Array.isArray(inputs)) {
        throw Error(`Expected inputs param to be an array but found ${inputs}`);
    }
    inputs.forEach((input, index) => {
        if (!(input instanceof AssetTransferInput)) {
            throw Error(
                `Expected an item of inputs to be an AssetTransferInput but found ${input} at index ${index}`
            );
        }
    });
}

function checkTransferOutputs(outputs: Array<AssetTransferOutput>) {
    if (!Array.isArray(outputs)) {
        throw Error(
            `Expected outputs param to be an array but found ${outputs}`
        );
    }
    outputs.forEach((output, index) => {
        if (!(output instanceof AssetTransferOutput)) {
            throw Error(
                `Expected an item of outputs to be an AssetTransferOutput but found ${output} at index ${index}`
            );
        }
    });
}

function checkTransactionId(value: H256 | string) {
    if (!H256.check(value)) {
        throw Error(
            `Expected transactionId param to be an H256 value but found ${value}`
        );
    }
}

function checkIndex(index: number) {
    if (typeof index !== "number") {
        throw Error(`Expected index param to be a number but found ${index}`);
    }
}

function checkAssetType(value: H256 | string) {
    if (!H256.check(value)) {
        throw Error(
            `Expected assetType param to be an H256 value but found ${value}`
        );
    }
}

function checkAssetOutPoint(
    value:
        | AssetOutPoint
        | {
              transactionId: H256 | string;
              index: number;
              assetType: H256 | string;
              amount: U64 | number | string;
              lockScriptHash?: H256 | string;
              parameters?: Buffer[];
          }
) {
    if (value !== null && typeof value !== "object") {
        throw Error(
            `Expected assetOutPoint param to be either an AssetOutPoint or an object but found ${value}`
        );
    }
    const {
        transactionId,
        index,
        assetType,
        amount,
        lockScriptHash,
        parameters
    } = value;
    checkTransactionId(transactionId);
    checkIndex(index);
    checkAssetType(assetType);
    checkAmount(amount);
    if (lockScriptHash) {
        checkLockScriptHash(lockScriptHash);
    }
    if (parameters) {
        checkParameters(parameters);
    }
}

function checkOrder(order: Order | null) {
    if (order !== null && !(order instanceof Order)) {
        throw Error(
            `Expected order param to be either null or an Order value but found ${order}`
        );
    }
}

function checkIndices(indices: Array<number>) {
    if (!Array.isArray(indices)) {
        throw Error(
            `Expected indices param to be an array but found ${indices}`
        );
    }
    indices.forEach((value, idx) => {
        if (typeof value !== "number") {
            throw Error(
                `Expected an indices to be an array of numbers but found ${value} at index ${idx}`
            );
        }
    });
}

function checkLockScriptHash(value: H160 | string) {
    if (!H160.check(value)) {
        throw Error(
            `Expected lockScriptHash param to be an H160 value but found ${value}`
        );
    }
}

function checkTransactionHash(value: H256 | string) {
    if (!H256.check(value)) {
        throw Error(
            `Expected hash param to be an H256 value but found ${value}`
        );
    }
}

function checkSecret(value: H256 | string) {
    if (!H256.check(value)) {
        throw Error(
            `Expected secret param to be an H256 value but found ${value}`
        );
    }
}

function checkParameters(parameters: Buffer[]) {
    if (!Array.isArray(parameters)) {
        throw Error(
            `Expected parameters param to be an array but found ${parameters}`
        );
    }
    parameters.forEach((p, index) => {
        if (!(p instanceof Buffer)) {
            throw Error(
                `Expected an item of parameters to be a Buffer instance but found ${p} at index ${index}`
            );
        }
    });
}

function checkTimelock(timelock: Timelock | null) {
    if (timelock === null) {
        return;
    }
    const { type, value } = timelock;
    if (
        type === "block" ||
        type === "blockAge" ||
        type === "time" ||
        type === "timeAge"
    ) {
        return;
    }
    if (typeof value === "number") {
        return;
    }
    throw Error(
        `Expected timelock param to be either null or an object containing both type and value but found ${timelock}`
    );
}

function checkLockScript(lockScript: Buffer) {
    if (!(lockScript instanceof Buffer)) {
        throw Error(
            `Expedted lockScript param to be an instance of Buffer but found ${lockScript}`
        );
    }
}

function checkUnlockScript(unlockScript: Buffer) {
    if (!(unlockScript instanceof Buffer)) {
        throw Error(
            `Expected unlockScript param to be an instance of Buffer but found ${unlockScript}`
        );
    }
}

function checkSignature(signature: string) {
    // ECDSA Signature
    if (
        typeof signature !== "string" ||
        !/^(0x)?[0-9a-fA-F]{130}$/.test(signature)
    ) {
        throw Error(
            `Expected signature param to be a 65 byte hexstring but found ${signature}`
        );
    }
}

function checkHandlerId(handlerId: number) {
    if (
        typeof handlerId !== "number" ||
        !Number.isInteger(handlerId) ||
        handlerId < 0
    ) {
        throw Error(
            `Expected handlerId param to be a non-negative number value but found ${handlerId}`
        );
    }
}

function checkBytes(bytes: Buffer) {
    if (!(bytes instanceof Buffer)) {
        throw Error(
            `Expected bytes param to be an instance of Buffer but found ${bytes}`
        );
    }
}
