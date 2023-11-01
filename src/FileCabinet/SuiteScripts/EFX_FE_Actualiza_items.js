/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 */
    (record, search) => {

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

            try {
                var record = scriptContext.newRecord;
                var num_articulos = record.getLineCount({ sublistId: 'item' });

                var all_items = [] //* id de items
                for (let item = 0; item < num_articulos; item++) {
                    var id_item = record.getSublistValue({ sublistId: 'item', fieldId: 'item', line: item });
                    log.audit({ title: 'id_item', details: id_item });
                    all_items.push(id_item);
                }
                var datos_busqueda = buscaClaveProdServ(all_items);
                log.audit({title: 'datos_busqueda', details: datos_busqueda});

                //* Manejo de errores
                if (!datos_busqueda.success) {
                    throw datos_busqueda.error;
                }

                for (let item = 0; item < num_articulos; item++) {
                    var id_item = record.getSublistValue({ sublistId: 'item', fieldId: 'item', line: item });
                    log.audit({title: 'condicion para poner el dato en linea', details: datos_busqueda.indexs.indexOf(id_item)});
                    var claveProdServ_item = record.getSublistValue({ sublistId: 'item', fieldId: 'custcol_mx_txn_line_sat_item_code', line: item });
                    log.audit({title: 'claveProdServ', details: claveProdServ_item});
                    if (claveProdServ_item == "") {
                        if (datos_busqueda.indexs.indexOf(id_item) != -1) {
                            record.setSublistValue({sublistId: 'item', line: item, fieldId:'custcol_mx_txn_line_sat_item_code', value: datos_busqueda.data[datos_busqueda.indexs.indexOf(id_item)]})
                        }
                    }
                }

            } catch (error) {
                log.error({ title: 'error', details: error })
            }
        }

        const buscaClaveProdServ = (all_items) => {
            var response = {
                success: false,
                error: "",
                data: [],
                indexs: []
            }
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["internalid", "anyof", all_items]
                        ],
                    columns:
                        [
                            "internalid",
                            "custitem_mx_txn_item_sat_item_code"
                        ]
                });
                var searchResultCount = itemSearchObj.runPaged().count;
                log.debug("itemSearchObj result count", searchResultCount);
                itemSearchObj.run().each(function (result) {
                    log.audit({title: 'internalid', details: result.getValue({name: "internalid"})});
                    response.indexs.push(result.getValue({name: "internalid"}));
                    log.audit({title: 'custitem_mx_txn_item_sat_item_code', details: result.getValue({name: "custitem_mx_txn_item_sat_item_code"})});
                    response.data.push(result.getValue({name: "custitem_mx_txn_item_sat_item_code"}) || "");
                    return true;
                });
                response.success = true;
            } catch (error) {
                log.error({title: 'error on buscaClaveProdServ', details: error});
                response.error =  error;
                response.success = false;
            }
            return response;


        }

        return { beforeSubmit }

    });
