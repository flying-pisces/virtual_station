/*
 * JaamSim Discrete Event Simulation
 * Copyright (C) 2018 JaamSim Software Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.jaamsim.CalculationObjects;

public interface Controllable {

	/**
	 * Returns the Controller that signals the updating of this object.
	 * @return Controller for this object
	 */
	public Controller getController();

	/**
	 * Returns the sequence number that determines the order in which the Controller's objects
	 * are updated. Objects with smaller sequence numbers are updated before ones with larger
	 * numbers.
	 * @return sequence number
	 */
	public double getSequenceNumber();

	/**
	 * Executes the update for this object that is generated by the Controller.
	 * @param simTime - present simulation time
	 */
	public void update(double simTime);

}
