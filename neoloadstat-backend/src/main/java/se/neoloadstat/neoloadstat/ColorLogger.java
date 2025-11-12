package se.neoloadstat.neoloadstat;

import org.slf4j.LoggerFactory;
public class ColorLogger {

    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger("");

    public void logDebug(String logging) {
        LOGGER.debug("\u001B[92m" + logging + "\u001B[0m");
    }

    public void logInfo(String logging) {
        LOGGER.info("\u001B[93m" + logging + "\u001B[0m");
    }

    public void logError(String logging) {
        LOGGER.error("\u001B[91m" + logging + "\u001B[0m");
    }
}
