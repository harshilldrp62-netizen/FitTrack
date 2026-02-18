package com.yourname.fitness.healthsteps;

import com.getcapacitor.Logger;

public class HealthStepsPlugin {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
