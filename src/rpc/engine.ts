import { PlatformAddress, U64 } from "codechain-primitives";

import { Rpc } from ".";
import { toHex } from "../utils";

const RLP = require("rlp");

export class EngineRpc {
    private rpc: Rpc;
    private fallbackServers?: string[];
    /**
     * @hidden
     */
    constructor(rpc: Rpc, options: { fallbackServers?: string[] }) {
        this.rpc = rpc;
        const { fallbackServers } = options;
        this.fallbackServers = fallbackServers;
    }

    /**
     * Gets coinbase's account id.
     * @returns PlatformAddress or null
     */
    public getCoinbase(): Promise<PlatformAddress | null> {
        const fallbackServers = this.fallbackServers;
        return new Promise((resolve, reject) => {
            this.rpc
                .sendRpcRequest("engine_getCoinbase", [], { fallbackServers })
                .then(result => {
                    try {
                        resolve(
                            result === null
                                ? null
                                : PlatformAddress.fromString(result)
                        );
                    } catch (e) {
                        reject(
                            Error(
                                `Expected engine_getCoinbase to return a PlatformAddress string or null, but an error occurred: ${e.toString()}`
                            )
                        );
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Gets coinbase's account id.
     * @returns PlatformAddress or null
     */
    public getBlockReward(): Promise<U64> {
        const fallbackServers = this.fallbackServers;
        return new Promise((resolve, reject) => {
            this.rpc
                .sendRpcRequest("engine_getBlockReward", [], {
                    fallbackServers
                })
                .then(result => {
                    try {
                        resolve(U64.ensure(result));
                    } catch (e) {
                        reject(
                            Error(
                                `Expected engine_getBlockReward to return a U64, but an error occurred: ${e.toString()}`
                            )
                        );
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Gets coinbase's account id.
     * @returns PlatformAddress or null
     */
    public getRecommendedConfirmation(): Promise<number> {
        const fallbackServers = this.fallbackServers;
        return new Promise((resolve, reject) => {
            this.rpc
                .sendRpcRequest("engine_getRecommendedConfirmation", [], {
                    fallbackServers
                })
                .then(result => {
                    if (typeof result === "number") {
                        return resolve(result);
                    }
                    reject(
                        Error(
                            `Expected engine_getRecommendedConfirmation to return a number but it returned ${result}`
                        )
                    );
                })
                .catch(reject);
        });
    }

    /**
     * Gets custom type's data at blockNumber with keyFragments.
     * @param handlerId number
     * @param keyFragments any[]
     * @param blockNumber? number
     * @returns string or null returns
     */
    public getCustomActionData(
        handlerId: number,
        keyFragments: any[],
        blockNumber?: number
    ): Promise<string | null> {
        if (
            typeof handlerId !== "number" ||
            !Number.isInteger(handlerId) ||
            handlerId < 0
        ) {
            throw Error(
                `Expected the first argument to be non-negative integer but found ${handlerId}`
            );
        }
        if (
            typeof blockNumber !== "undefined" &&
            (typeof blockNumber !== "number" ||
                !Number.isInteger(blockNumber) ||
                blockNumber < 0)
        ) {
            throw Error(
                `Expected the third argument to be non-negative integer but found ${blockNumber}`
            );
        }

        return new Promise((resolve, reject) => {
            const fallbackServers = this.fallbackServers;
            const rlpKeyFragments = toHex(RLP.encode(keyFragments));
            this.rpc
                .sendRpcRequest(
                    "engine_getCustomActionData",
                    [handlerId, `0x${rlpKeyFragments}`, blockNumber],
                    { fallbackServers }
                )
                .then(result => {
                    if (result == null) {
                        return resolve(null);
                    } else if (
                        typeof result === "string" &&
                        /^([A-Fa-f0-9]|\s)*$/.test(result)
                    ) {
                        return resolve(result);
                    }
                    reject(
                        Error(
                            `Expected engine_getCustomActionData to return a hex string or null but it returned ${result}`
                        )
                    );
                })
                .catch(reject);
        });
    }
}
