import { getDB, api } from '../db';
import { FACEBOOK_APP_ID } from '../constants'; // Ensure this exists

// Extend Window interface for FB SDK
declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

export const initFacebookSdk = () => {
    return new Promise<void>((resolve) => {
        if (window.FB) {
            resolve();
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: FACEBOOK_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            resolve();
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            // @ts-ignore
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            // @ts-ignore
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    });
};

export const loginWithFacebook = () => {
    return new Promise<{ accessToken: string, userID: string }>((resolve, reject) => {
        if (!window.FB) reject('FB SDK not loaded');

        window.FB.login((response: any) => {
            if (response.authResponse) {
                resolve({
                    accessToken: response.authResponse.accessToken,
                    userID: response.authResponse.userID
                });
            } else {
                reject('User cancelled login or did not fully authorize.');
            }
        }, { scope: 'public_profile,email,ads_read,read_insights' });
    });
};

export const getAdAccounts = (accessToken: string) => {
    return new Promise<any[]>((resolve, reject) => {
        window.FB.api('/me/adaccounts', 'GET', { access_token: accessToken, fields: 'id,name,account_id,currency' }, (response: any) => {
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response.data);
            }
        });
    });
};

export const getCampaigns = (adAccountId: string, accessToken: string) => {
    return new Promise<any[]>((resolve, reject) => {
        console.log(`Fetching campaigns for account: ${adAccountId}`);
        window.FB.api(`/${adAccountId}/campaigns`, 'GET', {
            access_token: accessToken,
            fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget'
        }, (response: any) => {
            console.log(`Campaigns API Response for ${adAccountId}:`, response);
            if (response.error) {
                console.error('Campaign fetch error:', response.error);
                reject(response.error);
            } else {
                const campaigns = response.data || [];
                console.log(`Found ${campaigns.length} campaigns`);
                resolve(campaigns);
            }
        });
    });
};

export const getAdSets = (campaignId: string, accessToken: string) => {
    return new Promise<any[]>((resolve, reject) => {
        window.FB.api(`/${campaignId}/adsets`, 'GET', { access_token: accessToken, fields: 'id,name,status,effective_status' }, (response: any) => {
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response.data);
            }
        });
    });
};

export const getAds = (adSetId: string, accessToken: string) => {
    return new Promise<any[]>((resolve, reject) => {
        window.FB.api(`/${adSetId}/ads`, 'GET', { access_token: accessToken, fields: 'id,name,status,effective_status' }, (response: any) => {
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response.data);
            }
        });
    });
};

export const getInsights = (objectId: string, accessToken: string, level: 'account' | 'campaign' | 'adset' | 'ad' = 'account', dateRange: any = { date_preset: 'last_30d' }) => {
    return new Promise<any>((resolve, reject) => {
        window.FB.api(`/${objectId}/insights`, 'GET', {
            access_token: accessToken,
            ...dateRange,
            fields: 'spend,impressions,clicks,cpc,cpm,cpp,ctr,reach,actions,cost_per_action_type',
            level: level
        }, (response: any) => {
            console.log(`Insights API Response for ${objectId} (${level}, ${JSON.stringify(dateRange)}):`, response);
            if (response.error) {
                reject(response.error);
            } else if (response.data && response.data.length > 0) {
                // If multiple rows (breakdowns or multiple days), aggregate them
                const aggregated = response.data.reduce((acc: any, curr: any) => {
                    return {
                        ...curr, // Use last item as base
                        spend: (parseFloat(acc.spend) || 0) + (parseFloat(curr.spend) || 0),
                        reach: (parseInt(acc.reach) || 0) + (parseInt(curr.reach) || 0),
                        impressions: (parseInt(acc.impressions) || 0) + (parseInt(curr.impressions) || 0),
                        actions: mergeActionArrays(acc.actions, curr.actions)
                    };
                }, { spend: 0, reach: 0, impressions: 0, actions: [] });
                resolve(aggregated);
            } else {
                resolve(null);
            }
        });
    });
};


function mergeActionArrays(a1: any[] = [], a2: any[] = []) {
    const map = new Map();
    a1.concat(a2).forEach(a => {
        if (!a || !a.action_type) return;
        const val = map.get(a.action_type) || 0;
        map.set(a.action_type, val + parseFloat(a.value || 0));
    });
    return Array.from(map.entries()).map(([k, v]) => ({ action_type: k, value: String(v) }));
}

