/* @flow */


import React, { PureComponent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BigNumber from 'bignumber.js';

import { findDeviceAccounts } from 'reducers/AccountsReducer';
import * as stateUtils from 'reducers/utils';
import Loader from 'components/LoaderCircle';
import Tooltip from 'rc-tooltip';

import colors from 'config/colors';
import { FONT_SIZE, BORDER_WIDTH } from 'config/variables';
import styled, { css } from 'styled-components';
import Row from '../Row';
import PropTypes from 'prop-types';

//import AsideRowAccount from './row/account/AsideRowAccount';

import type { TrezorDevice, Accounts } from 'flowtype';
import type { Props } from './index';

const RowAccountWrapper = styled.div`
    height: 64px;

    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_PRIMARY};

    border-top: 1px solid ${colors.DIVIDER};
    span {
        font-size: ${FONT_SIZE.SMALLER};
        color: ${colors.TEXT_SECONDARY};
    }

    ${props => props.isSelected && css`
        border-left: ${BORDER_WIDTH.SELECTED} solid ${colors.GREEN_PRIMARY};
        background: ${colors.WHITE};

        &:hover {
            background-color: ${colors.WHITE};
        }

        &:last-child {
            border-bottom: 1px solid ${colors.DIVIDER};
        }
    `}
`;
const RowAccount = ({
    accountIndex, balance, url, isSelected = false,
}) => (
    <NavLink to={url}>
        <RowAccountWrapper
            to={url}
            isSelected={isSelected}
        >
            <Row column>
                Account #{accountIndex + 1}
                {balance ? (
                    <span>{balance}</span>
                ) : (
                    <span>Loading...</span>
                )}
            </Row>
        </RowAccountWrapper>
    </NavLink>
);
RowAccount.propTypes = {
    accountIndex: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
    balance: PropTypes.string,
    isSelected: PropTypes.bool,
};

const AccountSelection = (props: Props): ?React$Element<string> => {
    const selected = props.wallet.selectedDevice;
    if (!selected) return null;

    const { location } = props.router;
    const urlParams = location.state;
    const { accounts } = props;
    const baseUrl: string = urlParams.deviceInstance ? `/device/${urlParams.device}:${urlParams.deviceInstance}` : `/device/${urlParams.device}`;

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === location.state.network);
    if (!selectedCoin) return;

    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    const deviceAccounts: Accounts = findDeviceAccounts(accounts, selected, location.state.network);

    let selectedAccounts = deviceAccounts.map((account, i) => {
        // const url: string = `${baseUrl}/network/${location.state.network}/account/${i}`;
        const url: string = location.pathname.replace(/account+\/([0-9]*)/, `account/${i}`);

        let balance: string = 'Loading...';
        if (account.balance !== '') {
            const pending = stateUtils.getAccountPendingTx(props.pending, account);
            const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, selectedCoin.symbol);
            const availableBalance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

            if (fiatRate) {
                const accountBalance = new BigNumber(availableBalance);
                const fiat = accountBalance.times(fiatRate.value).toFixed(2);
                balance = `${availableBalance} ${selectedCoin.symbol} / $${fiat}`;
            } else {
                balance = `${availableBalance} ${selectedCoin.symbol}`;
            }
        }

        return (
            <RowAccount
                accountIndex={account.index}
                balance={balance}
                url={url}
            />

            // <NavLink key={i} activeClassName="selected" className="account" to={url}>
            //     { `Account #${(account.index + 1)}` }
            //     <span>{ account.loaded ? balance : 'Loading...' }</span>
            // </NavLink>
        );
    });

    if (selectedAccounts.length < 1) {
        if (selected.connected) {
            const url: string = location.pathname.replace(/account+\/([0-9]*)/, 'account/0');
            selectedAccounts = (
                <RowAccount
                    accountIndex={0}
                    url={url}
                />

                // <NavLink activeClassName="selected" className="account" to={url}>
                //     Account #1
                //     <span>Loading...</span>
                // </NavLink>
            );
        }
    }

    let discoveryStatus = null;
    const discovery = props.discovery.find(d => d.deviceState === selected.state && d.network === location.state.network);

    if (discovery) {
        if (discovery.completed) {
            // TODO: add only if last one is not empty
            //if (selectedAccounts.length > 0 && selectedAccounts[selectedAccounts.length - 1])
            const lastAccount = deviceAccounts[deviceAccounts.length - 1];
            if (lastAccount && (new BigNumber(lastAccount.balance).greaterThan(0) || lastAccount.nonce > 0)) {
                discoveryStatus = (
                    <div className="add-account" onClick={props.addAccount}>
                        Add account
                    </div>
                );
            } else {
                const tooltip = (
                    <div className="aside-tooltip-wrapper">
                        To add a new account, last account must have some transactions.
                    </div>
                );
                discoveryStatus = (
                    <Tooltip
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}
                        overlay={tooltip}
                        placement="top"
                    >
                        <div className="add-account disabled">
                            Add account
                        </div>
                    </Tooltip>
                );
            }
        } else if (!selected.connected || !selected.available) {
            discoveryStatus = (
                <div className="discovery-status">
                    Accounts could not be loaded
                    <span>{`Connect ${selected.instanceLabel} device`}</span>
                </div>
            );
        } else {
            discoveryStatus = (
                <div className="discovery-loading">
                    <Loader size="20" /> Loading accounts...
                </div>
            );
        }
    }


    let backButton = null;
    if (selectedCoin) {
        backButton = (
            <NavLink to={baseUrl} className={`back ${selectedCoin.network}`}>
                <span className={selectedCoin.network}>{selectedCoin.name}</span>
            </NavLink>
        );
    }

    return (
        <React.Fragment>
            {backButton}
            <div>
                {selectedAccounts}
            </div>
            {discoveryStatus}
        </React.Fragment>
    );
};

export default AccountSelection;
