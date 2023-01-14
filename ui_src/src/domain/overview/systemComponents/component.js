// Copyright 2021-2022 The Memphis Authors
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.package server

import './style.scss';

import React from 'react';
import { Divider } from '@material-ui/core';

import HealthyBadge from '../../../components/healthyBadge';
import { PieChart, Pie } from 'recharts';
import OverflowTip from '../../../components/tooltip/overflowtip';
import { Add } from '@material-ui/icons';
import { Popover } from 'antd';
import CheckCircleSharpIcon from '@material-ui/icons/CheckCircleSharp';
import ErrorSharpIcon from '@material-ui/icons/ErrorSharp';
import Cancel from '@material-ui/icons/Cancel';

const remainingPorstPopInnerStyle = { padding: '10px', borderRadius: '12px', border: '1px solid #f0f0f0' };

const Component = ({ comp, i }) => {
    const getData = (comp) => {
        let data = [];
        if (comp?.actual_pods > 0) {
            for (let i = 0; i < comp?.actual_pods; i++) data.push({ name: `actual${i}`, value: 1, fill: '#6557FF' });
        }
        if (comp?.desired_pods > comp?.actual_pods) {
            for (let i = 0; i < comp?.desired_pods - comp?.actual_pods; i++) data.push({ name: `desired${i}`, value: 1, fill: '#EBEAED' });
        }
        return data;
    };

    const getStatus = (status) => {
        switch (status) {
            case 'red':
                return <Cancel className={status} theme="outlined" />;
            case 'yellow':
                return <ErrorSharpIcon className={status} theme="outlined" />;
            case 'green':
                return <CheckCircleSharpIcon className={status} theme="outlined" />;
        }
    };
    return (
        <div className="sys-components-container" key={`${comp.podName}${i}`}>
            <div className="sys-components">
                <OverflowTip text={comp.name}>
                    <p className="component-name">{comp.name}</p>
                </OverflowTip>
                <div className="pie-status-component">
                    <div className="pie-status">
                        <PieChart height={33} width={33}>
                            <Pie dataKey="value" data={getData(comp)} startAngle={-270}></Pie>
                        </PieChart>
                        <p>
                            {comp.actual_pods}/{comp.desired_pods}
                        </p>
                    </div>
                    {getStatus(comp.status)}
                </div>
            </div>
            <div className="pods-container">
                <label>{comp?.address} </label>
                <label className="ports">PORTS</label>
                <p>{comp.ports[0]}</p>
                {comp.ports?.length > 1 && (
                    <Popover
                        overlayInnerStyle={remainingPorstPopInnerStyle}
                        placement="bottomLeft"
                        content={comp.ports?.slice(1)?.map((port) => {
                            return <p className="port-popover">{port}</p>;
                        })}
                    >
                        <div className="plus-ports">
                            <Add className="add" />
                            <p>{comp.ports?.length - 1}</p>
                        </div>
                    </Popover>
                )}
            </div>
        </div>
    );
};

export default Component;
