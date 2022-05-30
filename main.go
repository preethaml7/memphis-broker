// Copyright 2021-2022 The Memphis Authors
// Licensed under the GNU General Public License v3.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.gnu.org/licenses/gpl-3.0.en.html
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"memphis-control-plane/analytics"
	"memphis-control-plane/background_tasks"
	"memphis-control-plane/broker"
	"memphis-control-plane/db"
	"memphis-control-plane/handlers"
	"memphis-control-plane/http_server"
	"memphis-control-plane/logger"
	"memphis-control-plane/tcp_server"
	"os"
	"sync"
)

func main() {
	err := analytics.InitializeAnalytics()
	handleError("Failed to initialize analytics: ", err)

	err = handlers.CreateRootUserOnFirstSystemLoad()
	handleError("Failed to create root user: ", err)

	err = logger.InitializeLogger()
	handleError("Failed initializing logger: ", err)

	defer db.Close()
	defer broker.Close()
	defer analytics.Close()

	wg := new(sync.WaitGroup)
	wg.Add(4)

	go background_tasks.ConsumeLogs(wg)
	go tcp_server.InitializeTcpServer(wg)
	go http_server.InitializeHttpServer(wg)
	go background_tasks.KillZombieConnections(wg)

	env := os.Getenv("ENVIRONMENT")
	if env == "" && os.Getenv("DOCKER_ENV") != "" {
		env = "Docker"
		logger.Info("\n**********\n\nDashboard: http://localhost:9000\nMemphis broker: localhost:5555 (Management Port) / 7766 (Data Port) / 6666 (TCP Port)\nUI/CLI root username - root\nUI/CLI root password - memphis  \n\n**********")
	} else if env == "" && os.Getenv("DOCKER_ENV") == "" {
		env = "K8S"
	}

	logger.Info("Memphis control plane is up and running, ENV: " + env)
	wg.Wait()
}

func handleError(message string, err error) {
	if err != nil {
		logger.Error(message + " " + err.Error())
		panic(message + " " + err.Error())
	}
}
