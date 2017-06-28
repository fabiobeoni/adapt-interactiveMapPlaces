/**
 * Utility to generate GUID codes.
 * @author Fabio Beoni: https://github.com/fabiobeoni | https://it.linkedin.com/in/fabio-beoni-6a7848101
 */
define(function () {
    return {
        s4:function() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        },
        guid:function() {
            return this.s4() +
                this.s4() + '-' +
                this.s4() + '-' +
                this.s4() + '-' +
                this.s4() + '-' +
                this.s4()
        }
    };
});
