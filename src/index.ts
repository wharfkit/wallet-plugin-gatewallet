import {
    AbstractWalletPlugin,
    LoginContext,
    LogoutContext,
    ResolvedSigningRequest,
    TransactContext,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
} from '@wharfkit/session'

export class WalletPluginGateWallet extends AbstractWalletPlugin implements WalletPlugin {
    id = 'gatewallet'

    translations = {}
    /**
     * The logic configuration for the wallet plugin.
     */
    readonly config: WalletPluginConfig = {
        // Should the user interface display a chain selector?
        requiresChainSelect: true,

        // Should the user interface display a permission selector?
        requiresPermissionSelect: false,
    }

    constructor() {
        super()
    }

    private async loadScatterProtocol() {
        let protocolScatter
        if (typeof window !== 'undefined') {
            protocolScatter = await import('@wharfkit/protocol-scatter')
        }

        if (!protocolScatter) {
            throw new Error('Scatter protocol is not available in this environment')
        }

        return protocolScatter
    }
    /**
     * The metadata for the wallet plugin to be displayed in the user interface.
     */
    readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
        name: 'Gate Wallet',
        description: '',
        logo: 'data:image/png;base64,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',
        homepage: 'https://web3.gate.com/',
        download: 'https://web3.gate.com/',
    })

    /**
     * Performs the wallet logic required to login and return the chain and permission level to use.
     *
     * @param options LoginContext
     * @returns Promise<WalletPluginLoginResponse>
     */
    async login(context: LoginContext) {
        const protocolScatter = await this.loadScatterProtocol()
        return protocolScatter.handleLogin(context)
    }

    /**
     * Performs the wallet logic required to logout.
     *
     * @param context: LogoutContext
     * @returns Promise<void>
     */

    async logout(context: LogoutContext): Promise<void> {
        const protocolScatter = await this.loadScatterProtocol()
        return protocolScatter.handleLogout(context)
    }

    /**
     * Performs the wallet logic required to sign a transaction and return the signature.
     *
     * @param chain ChainDefinition
     * @param resolved ResolvedSigningRequest
     * @returns Promise<Signature>
     */
    async sign(resolved: ResolvedSigningRequest, context: TransactContext) {
        const protocolScatter = await this.loadScatterProtocol()

        return protocolScatter.handleSignatureRequest(resolved, context)
    }
}