$(document).ready(function() {
    layui.use(['laydate', 'layer', 'form', 'laypage'], function() {
        const {laydate, layer, form, laypage} = layui;

        const setTodayDatePicker = (selector)=>{
            const today = new Date().toISOString().split('T')[0];
            laydate.render({
                elem: selector,
                value: today
            });
        }
        ;

        $(document).keyup(function(e) {
            if (e.keyCode === 27) {
                layer.closeAll();
            }
        });

        const fetchData = (url,method,data,successCallback)=>{
            const ajaxOptions = {
                url,
                type: method,
                success: successCallback,
                error: (error)=>{
                    console.error('错误:', error);
                    layer.closeAll('loading');
                }
            };

            if (method === 'GET') {
                ajaxOptions.url += '?' + $.param(data);
            } else {
                ajaxOptions.data = JSON.stringify(data);
                ajaxOptions.contentType = 'application/json';
            }

            $.ajax(ajaxOptions);
        }
        ;

        const populateTable = (data)=>{
            const tableBody = $('#dataTable tbody').empty();
            data.forEach((item)=>{
                const row = $('<tr></tr>');
                Object.keys(item).forEach((key)=>{
                    if (key !== 'id') {
                        const value = key === 'isPurchased' ? (item[key] ? '是' : '否') : item[key];
                        row.append(`<td>${value}</td>`);
                    }
                }
                );
                row.append(`<td>
                    <button class="layui-btn layui-btn-sm editBtn" data-id="${item.id}">编辑</button>
                    <button class="layui-btn layui-btn-danger layui-btn-sm deleteBtn" data-id="${item.id}">删除</button>
                </td>`);
                tableBody.append(row);
            }
            );
        }
        ;

        const setupPagination = (totalRecords,currentPage)=>{
            layui.use('laypage', function() {
                const laypage = layui.laypage;

                laypage.render({
                    elem: 'pagination',
                    count: totalRecords,
                    limit: 15,
                    curr: currentPage,
                    // 使用传入的当前页码
                    layout: ['prev', 'page', 'next'],
                    jump: function(obj, first) {
                        if (!first) {
                            const selectedDate = $('#datePicker').val();
                            fetchData('/query', 'GET', {
                                date: selectedDate,
                                page: obj.curr // 使用 laypage 提供的当前页码
                            }, function(response) {
                                populateTable(response.data);
                                // 更新当前页码
                                setupPagination(response.totalRecords, obj.curr);
                            });
                        }
                    }
                });
            });
        }
        ;

        $('#downloadBtn').click(()=>{
            const selectedDate = $('#datePicker').val();
            if (selectedDate) {
                window.location.href = `/download?date=${selectedDate}`;
            }
        }
        );

        setTodayDatePicker('#datePicker');
        setTodayDatePicker('#addDatePicker');

        $('#queryBtn').click(()=>{
            const selectedDate = $('#datePicker').val();
            if (selectedDate) {
                layer.load(2, {
                    shade: [0.1, '#fff']
                });
                fetchData('/query', 'GET', {
                    date: selectedDate,
                    page: 1
                }, (response)=>{
                    layer.closeAll('loading');
                    populateTable(response.data);
                    // Parse currentPage to integer
                    const currentPage = parseInt(response.currentPage);
                    setupPagination(response.totalRecords, currentPage);
                }
                );
            }
        }
        );

        $('#addBtn').click(()=>{
            const addModalContent = $('#addModalTemplate').html();
            const addModalIndex = layer.open({
                type: 1,
                title: '新增数据',
                content: addModalContent,
                area: ['500px', '886px'],
                success: ()=>{
                    setTodayDatePicker('#addDatePicker');
                    form.render();
                }
            });

            $(document).off('click', '#confirmAddBtn');

            $(document).on('click', '#confirmAddBtn', ()=>{
                const newData = {
                    date: $('#addDatePicker').val(),
                    account: $('#account').val(),
                    site: $('#site').val(),
                    name: $('#name').val(),
                    itemName: $('#itemName').val(),
                    duration: $('#duration').val(),
                    price: $('#price').val(),
                    paymentMethod: $('#paymentMethod').val(),
                    isPurchased: $('#isPurchased').is(':checked'),
                    purchaseAmount: $('#purchaseAmount').val(),
                    purchaseAccount: $('#purchaseAccount').val(),
                    transactionId: $('#transactionId').val(),
                    purchaseTeam: $('#purchaseTeam').val(),
                    wallet: $('#wallet').val()
                };

                fetchData('/add', 'POST', newData, (response)=>{
                    layer.close(addModalIndex);
                    $('#queryBtn').click();
                }
                );
            }
            );
        }
        );

        $(document).on('click', '.editBtn', function() {
            const id = $(this).data('id');
            fetchData(`/queryById`, 'GET', {
                id
            }, (response)=>{
                const editModalContent = $('#editModalTemplate').html();
                layer.open({
                    type: 1,
                    title: '编辑数据',
                    content: editModalContent,
                    area: ['500px', '465px'],
                    success: ()=>{
                        const item = response.data;
                        $('#editIsPurchased').prop('checked', item.is_purchased);
                        $('#editPurchaseAmount').val(item.purchase_amount);
                        $('#editPurchaseAccount').val(item.purchase_account);
                        $('#editTransactionId').val(item.transaction_id);
                        $('#editPurchaseTeam').val(item.purchase_team);
                        $('#editWallet').val(item.wallet);
                        form.render();
                    }
                });

                $(document).off('click', '#confirmEditBtn');

                $(document).on('click', '#confirmEditBtn', function() {
                    const updatedData = {
                        id,
                        isPurchased: $('#editIsPurchased').is(':checked'),
                        purchaseAmount: $('#editPurchaseAmount').val(),
                        purchaseAccount: $('#editPurchaseAccount').val(),
                        transactionId: $('#editTransactionId').val(),
                        purchaseTeam: $('#editPurchaseTeam').val(),
                        wallet: $('#editWallet').val()
                    };

                    fetchData('/edit', 'PUT', updatedData, (response)=>{
                        layer.closeAll();
                        $('#queryBtn').click();
                    }
                    );
                });
            }
            );
        });

        $(document).on('click', '.deleteBtn', function() {
            const id = $(this).data('id');
            layer.confirm('确定删除此条数据吗？', {
                icon: 3,
                title: '提示'
            }, function(index) {
                fetchData('/delete', 'DELETE', {
                    id
                }, (response)=>{
                    layer.close(index);
                    $('#queryBtn').click();
                }
                );
            });
        });
    });
});
