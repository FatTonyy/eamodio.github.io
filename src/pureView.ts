'use strict';
/*global document*/
import { DOM, Storage } from './dom';
import { View } from './view';

interface Donation {
	timestamp: number;
	tier: DonationTier | undefined;
	version: number;
}

enum DonationTier {
	OneDollar = 1,
	TwoDollars = 2,
	ThreePlusDollars = 3
}

const DonationKey = 'pure-donation';

export class PureView extends View {
	private readonly $donatePopup: HTMLElement;
	private _tier: DonationTier | undefined;

	constructor(public name: string) {
		super(name);

		DOM.on(document.body, 'click', this.onBodyClicked.bind(this));
		DOM.on('[data-action="pure-donate-close-button"]', 'click', this.onCloseButtonClicked.bind(this));
		DOM.on('[data-action="pure-donate-button"]', 'click', this.onDonateButtonClicked.bind(this));
		DOM.on('[data-action="pure-tier"]', 'click', this.onTierClicked.bind(this));
		DOM.on('[data-action="watch-toggle"]', 'click', this.onWatchClicked.bind(this));

		this.$donatePopup = DOM.$<HTMLElement>('[data-target="pure-donate-popup"]')[0]!;

		this.update(true);
	}

	activate(paths?: string[]) {
		super.activate(paths);

		DOM.$('[data-action="watch-toggle"]')[0]?.classList.remove('expand');

		const [route, ...data] = paths ?? [];
		switch (route) {
			case 'donate': {
				let [tier] = data;

				if (tier === 'reset') {
					Storage.clear();
					this.setPath('donate');
					location.reload();

					return;
				}

				let $el;
				[$el] = DOM.$('[data-target="donate-scroll-to"]');
				$el?.scrollIntoView({ behavior: 'smooth', block: 'start' });

				if (!tier) {
					const donation = Storage.get<Donation>(DonationKey);
					if (donation?.tier === undefined) {
						this.setActiveTier(undefined);

						return;
					}

					tier = donation.tier.toString();
				}

				const [$tier] = DOM.$<HTMLElement>(`[data-tier="${tier}"]`);

				const tierName = $tier.dataset.tierName;
				const amount = $tier.dataset.tierAmount;

				[$el] = DOM.$<HTMLAnchorElement>('[data-target="pure-donate-button"]');
				$el.href = `https://www.paypal.com/paypalme2/eamodio${amount == null ? '' : `/${amount}USD`}`;
				$el.innerHTML = `Donate ${tierName ? `${tierName} ` : ''}<span class="via">via</span> PayPal`;

				this.setActiveTier($tier?.classList.contains('active') ? undefined : Number(tier), $tier);

				break;
			}

			default: {
				this.setActiveTier(undefined);
			}
		}
	}

	private onBodyClicked(e: MouseEvent) {
		DOM.$('[data-action="watch-toggle"]')[0]?.classList.remove('expand');
	}

	private onCloseButtonClicked(e: MouseEvent) {
		this.setPath('/donate');
	}

	private onDonateButtonClicked(e: MouseEvent) {
		e.stopPropagation();

		setTimeout(() => this.setDonation(), 500);
	}

	private onTierClicked(e: MouseEvent) {
		e.stopPropagation();

		const tier = (e.currentTarget as HTMLElement)?.dataset.tier;
		const path = `/donate${tier ? `/${tier}` : ''}`;
		this.setPath(this.matchesPath(path) ? '/donate' : path);
	}

	private onWatchClicked(e: MouseEvent) {
		e.stopPropagation();

		(e.currentTarget as HTMLElement)?.classList.toggle('expand');
	}

	private setActiveTier(tier: DonationTier | undefined, $active?: HTMLElement) {
		this._tier = tier;

		const $els = DOM.$('[data-action="pure-tier"]');
		for (const $el of $els) {
			$el.classList.remove('active');
		}

		if (tier == null) {
			this.$donatePopup.classList.add('hide');
		} else {
			$active?.classList.add('active');
			this.$donatePopup.classList.remove('hide');
		}
	}

	private setDonation() {
		const date = new Date();
		const donation: Donation = {
			timestamp: date.getTime(),
			tier: this._tier,
			version: 1
		};

		Storage.set(DonationKey, donation);
		this.update();
	}

	private update(initializing: boolean = false) {
		const donation = Storage.get<Donation>(DonationKey);
		if (donation === undefined) return;

		const $container = DOM.$<HTMLDivElement>('[data-target="pure-donate-code-container"]')[0]!;
		$container.dataset.status = initializing ? 'donated' : 'pending';

		const $donatedOn = DOM.$<HTMLParagraphElement>('[data-target="pure-donated-on"]')[0]!;
		if ($donatedOn == null) {
			const template = document.createElement('template');
			template.innerHTML = `<p class="donated" data-target="pure-donated-on">
	You donated on ${new Date(donation.timestamp).toLocaleDateString()}. Thank you!
</p>`;

			this.$donatePopup.prepend(template.content.firstChild!);
		}

		const $code = DOM.$<HTMLDivElement>('[data-target="pure-donate-code"]')[0]!;

		if (!initializing) {
			const disposable = DOM.on(document, 'visibilitychange', () => {
				if (!document.hidden) {
					disposable.dispose();
					setTimeout(() => {
						$container.dataset.status = 'still-pending';

						const clickDisposable = DOM.on($code, 'click', () => {
							clickDisposable.dispose();

							$container.dataset.status = 'pending';
							setTimeout(() => ($container.dataset.status = 'donated'), 1000);
						});

						setTimeout(() => {
							clickDisposable.dispose();
							$container.dataset.status = 'donated';
						}, 20000);
					}, 10000);
				}
			});
		}

		const date = new Date();
		const code = `${date
			.getUTCFullYear()
			.toString()
			.substr(2)}${date.getUTCMonth().toString(16)}`;

		$code.textContent = code;
	}
}
